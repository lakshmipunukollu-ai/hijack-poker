'use strict';

// In-memory fallback store for local dev without DynamoDB Local
const players = new Map();
const transactions = new Map(); // key: playerId → array

function getPlayer(playerId) {
  return Promise.resolve(players.get(playerId) || null);
}

function putPlayer(player) {
  players.set(player.playerId, { ...player });
  return Promise.resolve();
}

function updatePlayer(playerId, updates) {
  const existing = players.get(playerId) || {};
  players.set(playerId, { ...existing, ...updates });
  return Promise.resolve();
}

function addTransaction(playerId, transaction) {
  const list = transactions.get(playerId) || [];
  list.unshift({ ...transaction, timestamp: Date.now() });
  transactions.set(playerId, list);
  return Promise.resolve();
}

function getTransactions(playerId, limit = 20) {
  const list = transactions.get(playerId) || [];
  return Promise.resolve(list.slice(0, limit));
}

function getAllPlayers() {
  return Promise.resolve([...players.values()]);
}

module.exports = { getPlayer, putPlayer, updatePlayer, addTransaction, getTransactions, getAllPlayers };
