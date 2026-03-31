'use strict';

const { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../../shared/config/dynamo');
const memoryStore = require('./memory-store');

const PLAYERS_TABLE = process.env.REWARDS_PLAYERS_TABLE || 'rewards-players';
const TRANSACTIONS_TABLE = process.env.REWARDS_TRANSACTIONS_TABLE || 'rewards-transactions';

let useMemory = false;
let storageReadyPromise;

async function checkConnection() {
  if (process.env.NODE_ENV === 'production') return;
  try {
    await docClient.send(new ScanCommand({ TableName: PLAYERS_TABLE, Limit: 1 }));
  } catch {
    console.warn('DynamoDB unavailable — using in-memory store for local dev');
    useMemory = true;
  }
}

function ensureStorageReady() {
  if (!storageReadyPromise) storageReadyPromise = checkConnection();
  return storageReadyPromise;
}

function isDatabaseConnectionError(err) {
  if (!err) return false;
  const seen = new Set();
  const stack = [err];
  while (stack.length) {
    const e = stack.pop();
    if (!e || seen.has(e)) continue;
    seen.add(e);
    const { code, name, message, cause, errors } = e;
    const msg = String(message || '');
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') return true;
    if (name === 'TimeoutError' || name === 'NetworkingError') return true;
    if (msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND')) return true;
    if (cause) stack.push(cause);
    if (Array.isArray(errors)) errors.forEach((x) => stack.push(x));
  }
  return false;
}

function asDatabaseUnavailable(err) {
  const wrapped = new Error(err.message);
  wrapped.isDatabaseUnavailable = true;
  wrapped.cause = err;
  return wrapped;
}

async function sendDoc(command) {
  try {
    return await docClient.send(command);
  } catch (err) {
    if (isDatabaseConnectionError(err)) throw asDatabaseUnavailable(err);
    throw err;
  }
}

/**
 * Get a player's rewards profile.
 */
async function getPlayer(playerId) {
  await ensureStorageReady();
  if (useMemory) return memoryStore.getPlayer(playerId);
  const result = await sendDoc(
    new GetCommand({
      TableName: PLAYERS_TABLE,
      Key: { playerId },
    })
  );
  return result.Item || null;
}

/**
 * Create or update a player's rewards profile.
 */
async function putPlayer(player) {
  await ensureStorageReady();
  if (useMemory) return memoryStore.putPlayer(player);
  await sendDoc(
    new PutCommand({
      TableName: PLAYERS_TABLE,
      Item: player,
    })
  );
}

/**
 * Ensure a player row exists (e.g. after issuing a token for demo or first API use).
 */
async function getOrCreatePlayer(playerId) {
  let player = await getPlayer(playerId);
  if (!player) {
    player = {
      playerId,
      monthlyPoints: 0,
      lifetimePoints: 0,
      currentTier: 'Bronze',
      tierFloor: 'Bronze',
      notifications: [],
      displayName: playerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await putPlayer(player);
  }
  return player;
}

/**
 * Update specific attributes on a player record.
 */
async function updatePlayer(playerId, updates) {
  await ensureStorageReady();
  if (useMemory) return memoryStore.updatePlayer(playerId, updates);
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value], i) => {
    expressions.push(`#k${i} = :v${i}`);
    names[`#k${i}`] = key;
    values[`:v${i}`] = value;
  });

  await sendDoc(
    new UpdateCommand({
      TableName: PLAYERS_TABLE,
      Key: { playerId },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

/**
 * Record a point transaction.
 */
async function addTransaction(playerId, transaction) {
  await ensureStorageReady();
  if (useMemory) return memoryStore.addTransaction(playerId, transaction);
  await sendDoc(
    new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: {
        playerId,
        timestamp: Date.now(),
        ...transaction,
      },
    })
  );
}

/**
 * Get a player's transaction history.
 */
async function getTransactions(playerId, limit = 20) {
  await ensureStorageReady();
  if (useMemory) return memoryStore.getTransactions(playerId, limit);
  const result = await sendDoc(
    new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      KeyConditionExpression: 'playerId = :pid',
      ExpressionAttributeValues: { ':pid': playerId },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return result.Items || [];
}

/**
 * Get all players (for leaderboard).
 */
async function getAllPlayers() {
  await ensureStorageReady();
  if (useMemory) return memoryStore.getAllPlayers();
  const result = await sendDoc(
    new ScanCommand({ TableName: PLAYERS_TABLE })
  );
  return result.Items || [];
}

module.exports = {
  getPlayer,
  putPlayer,
  getOrCreatePlayer,
  updatePlayer,
  addTransaction,
  getTransactions,
  getAllPlayers,
};
