import { program } from 'commander';
import { Gatherer, Generator, Reader } from './generator';
import path from 'path';

program.version('1.0.0');

program.option('--api <path>', 'api文件路径');
program.option('--mustache <path>', 'mustache文件路径');
program.option('--ts <path>', 'ts文件路径');
program.option('--py <path>', 'py文件路径');
program.option('--production', '是否在生产环境');

program.parse(process.argv);
const opts = program.opts();

const api = path.resolve(opts['api'].replace(/\\/g, '/')).replace(/\\/g, '/');
const mustache = path.resolve(opts['mustache'].replace(/\\/g, '/')).replace(/\\/g, '/');
const ts = path.resolve(opts['ts'].replace(/\\/g, '/')).replace(/\\/g, '/');
const py = path.resolve(opts['py'].replace(/\\/g, '/')).replace(/\\/g, '/');
const inProduction = opts['production'] as boolean;

const reader = new Reader(api, mustache);
const gatherer = new Gatherer(reader.apiRaws);
gatherer.data.inProduction = inProduction;
const generator = new Generator(ts, py);
generator.generate(reader, gatherer);
