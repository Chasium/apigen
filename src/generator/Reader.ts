import type { RawData } from '../data';
import fs from 'fs';
import path from 'path';
import yaml from 'yamljs';

interface MustacheFiles {
    ts: {
        httpApi: string;
        index: string;
        template: string;
        wsApi: string;
    };
    py: {
        httpApi: string;
        httpTemplate: string;
        wsApi: string;
        wsTemplate: string;
    };
}

export interface RawDataWithPath {
    data: RawData;
    path: string;
    name: string;
}

export class Reader {
    readonly apiRaws: RawDataWithPath[];
    readonly mustache: MustacheFiles;
    constructor(apisRoot: string, mustacheRoot: string) {
        this.mustache = {
            ts: {
                httpApi: fs.readFileSync(`${mustacheRoot}/ts/HTTPApi.ts.mustache`).toString(),
                wsApi: fs.readFileSync(`${mustacheRoot}/ts/WSApi.ts.mustache`).toString(),
                template: fs.readFileSync(`${mustacheRoot}/ts/template.mustache`).toString(),
                index: fs.readFileSync(`${mustacheRoot}/ts/index.ts.mustache`).toString(),
            },
            py: {
                httpApi: fs.readFileSync(`${mustacheRoot}/py/http_api.py.mustache`).toString(),
                wsApi: fs.readFileSync(`${mustacheRoot}/py/ws_api.py.mustache`).toString(),
                httpTemplate: fs.readFileSync(`${mustacheRoot}/py/http_template.mustache`).toString(),
                wsTemplate: fs.readFileSync(`${mustacheRoot}/py/ws_template.mustache`).toString(),
            },
        };
        this.apiRaws = this.findFiles(apisRoot, '');
    }

    private findFiles(from: string, temp: string) {
        const out: RawDataWithPath[] = [];
        fs.readdirSync(path.resolve(from)).forEach((file) => {
            const full = `${from}/${file}`;
            if (fs.statSync(path.resolve(full)).isFile()) {
                const raw = fs.readFileSync(path.resolve(full)).toString();
                out.push({
                    name: file.replace(/\.api$/, ''),
                    path: temp,
                    data: yaml.parse(raw),
                });
            } else {
                out.push(...this.findFiles(full, `${temp}/${file}`));
            }
        });
        return out;
    }
}
