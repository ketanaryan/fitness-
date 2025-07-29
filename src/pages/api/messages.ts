import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// This custom type helps us use `req.user` later
interface AuthenticatedRequest extends NextApiRequest {
  user?: { userId: string };
}

// This is a middleware function that checks for a valid JWT
const withAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => void) => 
  async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expects "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    try {
      // Verify the token using the secret key from your .env.local file
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      req.user = decoded; // Attach user info to the request object
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// This is the main API logic
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const client = await clientPromise;
  const db = client.db('fitness-chatbot');

  // Handle GET request to fetch all messages
  if (req.method === 'GET') {
    try {
      const messages = await db.collection('messages').find({}).sort({ timestamp: 1 }).toArray();
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Could not fetch messages' });
    }
  } 
  // Handle POST request to save a new message
  else if (req.method === 'POST') {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      
      const { text, sender } = req.body;
      const message = {
        text,
        sender, // Will be 'user' or 'ai'
        userId: new ObjectId(req.user.userId),
        timestamp: new Date(),
      };
      
      await db.collection('messages').insertOne(message);
      res.status(201).json({ message: 'Message saved' });
    } catch (error) {
      res.status(500).json({ message: 'Could not save message' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

// We wrap our handler with the security middleware
export default withAuth(handler);