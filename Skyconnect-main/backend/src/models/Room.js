import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    userId: String,
    username: String,
    socketId: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    sender: String,
    text: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Room', roomSchema);