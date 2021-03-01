const { validationResult } = require('express-validator');

const Room = require('../../models/room');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createRoom = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const {
      code, readerIp
    } = req.body;

    const sameCodeRoom = await Room.findOne({ code });
    if (sameCodeRoom)
      throw createError('Code already existed', 502);
    const sameReaderIp = await Room.findOne({ readerIp });
    if (sameReaderIp)
      throw createError('Reader IP already existed', 502);

    const newRoom = new Room({
      code,
      readerIp
    });
    await newRoom.save();

    res.status(201).json({
      message: 'Create room :D',
      roomId: newRoom._id,
      roomCode: newRoom.code,
      readerIp: newRoom.readerIp
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    if (!rooms)
      throw createError('Room not found D:', 404);

    res.status(200).json({
      message: 'Fetched rooms :D',
      rooms
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getRoom = async (req, res, next) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId);
    if (!room)
      throw createError('Room not found D:', 404);

    res.status(200).json({
      message: 'Room fetched :D',
      room
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const { roomId, code, readerIp } = req.body;
    const room = await Room.findById(roomId);
    if (!room)
      throw createError('room not found D:', 404);

    room.code = code;
    room.readerIp = readerIp;
    await room.save();

    res.status(200).json({
      message: 'Room updated :D',
      room
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.deleteRoom = async (req, res, next) => {
  const { roomId } = req.params;
  
  try {
    const room = await Room.findById(roomId);
    if (!room)
      throw createError('room not found D:', 404);

    await Room.findByIdAndRemove(roomId);
    res.status(200).json({
      message: 'Room deleted :D',
      roomName: room.name
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};
