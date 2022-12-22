import type { Gatherer } from './Gatherer';
import type { Reader } from './Reader';
import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';
import mustache from 'mustache';

export class Generator {
    constructor(private tsPath: string, private pyPath: string) {}
    generate(reader: Reader, gatherer: Gatherer) {
        rimraf.sync(this.tsPath);
        rimraf.sync(this.pyPath);
        fs.mkdirSync(path.resolve(this.tsPath), { recursive: true });
        fs.mkdirSync(path.resolve(this.pyPath), { recursive: true });
        this.generateTs(reader, gatherer);
        this.generatePy(reader, gatherer);
    }
    private generateTs(reader: Reader, gatherer: Gatherer) {
        const httpApi = mustache.render(reader.mustache.ts.httpApi, gatherer.data);
        const wsApi = mustache.render(reader.mustache.ts.wsApi, gatherer.data);
        const index = mustache.render(reader.mustache.ts.index, gatherer.data);
        fs.writeFileSync(path.resolve(`${this.tsPath}/HTTPApi.ts`), httpApi);
        console.log('Generated', `${this.tsPath}/HTTPApi.ts`);
        fs.writeFileSync(path.resolve(`${this.tsPath}/WSApi.ts`), wsApi);
        console.log('Generated', `${this.tsPath}/WSApi.ts`);
        fs.writeFileSync(path.resolve(`${this.tsPath}/index.ts`), index);
        console.log('Generated', `${this.tsPath}/index.ts`);
        gatherer.data.apis.forEach((data) => {
            const content = mustache.render(reader.mustache.ts.template, data);
            const file = `${this.tsPath}/generated${data.filePath}.ts`;
            const filePath = file.replace(/(.*)(\/.*?)$/, '$1');
            if (!fs.existsSync(path.resolve(filePath))) {
                fs.mkdirSync(path.resolve(filePath), { recursive: true });
            }
            fs.writeFileSync(path.resolve(file), content);
            console.log('Generated', file);
        });
    }
    private generatePy(reader: Reader, gatherer: Gatherer) {
        const httpApi = mustache.render(reader.mustache.py.httpApi, gatherer.data);
        const wsApi = mustache.render(reader.mustache.py.wsApi, gatherer.data);
        fs.writeFileSync(path.resolve(`${this.pyPath}/http_api.py`), httpApi);
        console.log('Generated', `${this.pyPath}/http_api.py`);
        fs.writeFileSync(path.resolve(`${this.pyPath}/ws_api.py`), wsApi);
        console.log('Generated', `${this.pyPath}/ws_api.py`);
        gatherer.data.apis.forEach((data) => {
            let template: string;
            if (data.isHTTP) {
                template = reader.mustache.py.httpTemplate;
            } else {
                template = reader.mustache.py.wsTemplate;
            }
            const content = mustache.render(template, data);
            const file = `${this.pyPath}/generated${data.filePath}.py`;
            const filePath = file.replace(/(.*)(\/.*?)$/, '$1');
            if (!fs.existsSync(path.resolve(filePath))) {
                fs.mkdirSync(path.resolve(filePath), { recursive: true });
            }
            fs.writeFileSync(path.resolve(file), content);
            console.log('Generated', file);
        });
    }
}
