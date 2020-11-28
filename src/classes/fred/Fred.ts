import Downloader from '../download/Downloader.interface';
import Macro from './Macro.enum';

class Fred {
  private dm: Downloader;

  constructor(dm: Downloader) {
    if (!dm) {
      throw new TypeError('Please, provide a valid Downloader');
    }
    this.dm = dm;
  }

  getDM(): Downloader {
    return this.dm;
  }

  getMacro(macro: Macro): void {
    console.log(`getting ${macro}`);
    throw new Error('Method not implemented.');
  }
}

export default Fred;
