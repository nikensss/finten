interface DataBase {
  create(o: any): boolean;
  read(o: any): any;
  update(o: any, n: any): boolean;
  delete(o: any): boolean;
}

export default DataBase;
