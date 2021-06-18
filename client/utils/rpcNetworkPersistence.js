const LOCAL_STORAGE_KEY = "rpc-network-persistence";

const DEFAULT_NETWORK_ID = process.env.DEFAULT_NETWORK_ID
  ? JSON.parse(process.env.DEFAULT_NETWORK_ID, 10)
  : 4;

export const rpcNetworkPersistence = {
  read() {
    const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);

    return storedValue ? parseInt(storedValue, 10) : DEFAULT_NETWORK_ID;
  },

  write(value) {
    localStorage.setItem(LOCAL_STORAGE_KEY, value);
  },
};
