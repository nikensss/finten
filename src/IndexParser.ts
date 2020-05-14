// DESCARREGA TOTS ELS https://www.sec.gov/Archives/edgar/full-index/{1994-2020}/QTR{1-4}/xbrl.idx
// DESCARREGA NOMES UNA EN UNA CARPETA TEMPORAL?

//PER CADA FITXER DINTRE DEL XBRL.IDX QUE CONTINGUI 10-K, GUARDEM EL CIK I L'ALTRE NUMERO
//(96699|TECHNICAL COMMUNICATIONS CORP|10-K|2019-12-13|edgar/data/96699/0001171843-19-008104.txt)

//GUARDEM EN UN FITXER TEMPORAL TOTS ELS SELECTS

class IndexParser {
  constructor() {}
  getUrl(year: string, quarter: string) {
    let url = `https://www.sec.gov/Archives/edgar/full-index/'${year}'/'${quarter}'/xbrl.idx`;
    console.log(`[IndexParser]: ${url} `);
  }
}
