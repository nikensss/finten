interface Database {
  connect(uri?: string): Promise<Database>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export default Database;
