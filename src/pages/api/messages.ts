import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends NextApiRequest {
  user?: { userId: string };
}

const withAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => void) => 
  async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const client = await clientPromise;
  const db = client.db('fitness-chatbot');
  
  if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated for this operation' });
  }

  if (req.method === 'GET') {
    try {
      // THE ONLY CHANGE IS ON THIS NEXT LINE
      const messages = await db.collection('messages').find({ userId: new ObjectId(req.user.userId) }).sort({ timestamp: 1 }).toArray();
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Could not fetch messages' });
    }
  } else if (req.method === 'POST') {
    try {
      const { text, sender } = req.body;
      const message = {
        text,
        sender,
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

export default withAuth(handler);