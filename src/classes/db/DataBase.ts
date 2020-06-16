interface DataBase {
  create(o: any): boolean;
  read(o: any): any;
  update(o: any, n: any): boolean;
  delete(o: any): boolean;
  find(o: any): any;
  exists(o: any): boolean;
}

export default DataBase;
