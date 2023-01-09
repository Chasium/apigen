import type { ApiData, Class, Event, Field, RawClass, RawField } from '../data';
import type { RawDataWithPath } from './Reader';

interface ApiDataWrapper {
    production: boolean;
    apis: ApiData[];
}

export class Gatherer {
    readonly data: ApiDataWrapper = { apis: [], production: false };
    constructor(raw: RawDataWithPath[]) {
        raw.forEach((data) => {
            const fileFull = `${data.path}/${data.name.replace(/\.apiData/, '')}`;
            if (data.data.type == 'http') {
                const api: ApiData = {
                    isHTTP: true,
                    apiPath: data.data.path,
                    filePath: fileFull,
                    filePackage: this.pathToPackage(fileFull),
                    solverPackage: data.data.serverSolver.package,
                    solverFunction: data.data.serverSolver.function,
                    reqClass: data.data.request,
                    pyReqClass: this.toPyName(data.data.request),
                    resClass: data.data.response,
                    pyResClass: this.toPyName(data.data.response),
                    classes: (() => {
                        const out: Class[] = [];
                        data.data.classes.forEach((raw) => out.push(this.buildClass(raw, data)));
                        return out;
                    })(),
                };
                this.data.apis.push(api);
            } else {
                const api: ApiData = {
                    isHTTP: false,
                    filePath: fileFull,
                    filePackage: this.pathToPackage(fileFull),
                    solverPackage: data.data.serverSolver.package,
                    solverFunction: data.data.serverSolver.function,
                    reqEvents: (() => {
                        const out: Event[] = [];
                        data.data.fromClient.forEach((raw) => {
                            out.push({
                                className: raw.class,
                                eventName: raw.name,
                                pyEventName: this.toPyEventName(raw.name),
                            });
                        });
                        return out;
                    })(),
                    resEvents: (() => {
                        const out: Event[] = [];
                        data.data.fromServer.forEach((raw) => {
                            out.push({
                                className: raw.class,
                                eventName: raw.name,
                                pyEventName: this.toPyEventName(raw.name),
                            });
                        });
                        return out;
                    })(),
                    classes: (() => {
                        const out: Class[] = [];
                        data.data.classes.forEach((raw) => out.push(this.buildClass(raw, data)));
                        return out;
                    })(),
                };
                this.data.apis.push(api);
            }
        });
    }
    private pathToPackage(path: string) {
        return `apigen.generated${path.replace(/[\/\\]/g, '.')}`;
    }
    private toPyName(name: string) {
        return name.replace(/(?<!^)([A-Z])/g, '_$1').toLowerCase();
    }
    private toPyEventName(name: string) {
        return name.replace(/:/g, '__');
    }

    private buildClass(data: RawClass, from: RawDataWithPath): Class {
        return {
            className: data.name,
            description: data.description == null ? [] : data.description.split('\n'),
            isReq: (() => {
                if (from.data.type == 'http') {
                    return from.data.request == data.name;
                } else {
                    let out = false;
                    from.data.fromClient.forEach((event) => {
                        if (event.class == data.name) {
                            out = true;
                        }
                    });
                    return out;
                }
            })(),
            isRes: (() => {
                if (from.data.type == 'http') {
                    return from.data.response == data.name;
                } else {
                    let out = false;
                    from.data.fromServer.forEach((event) => {
                        if (event.class == data.name) {
                            out = true;
                        }
                    });
                    return out;
                }
            })(),
            fields: (() => {
                const out = [];
                for (let i in data.fields) {
                    out.push(this.buildField(i, data.fields[i]));
                }
                return out;
            })(),
            eventName: (() => {
                if (from.data.type == 'http') {
                    return '';
                } else {
                    let out = '';
                    from.data.fromServer.forEach((event) => {
                        if (event.class == data.name) {
                            out = event.name;
                        }
                    });
                    from.data.fromClient.forEach((event) => {
                        if (event.class == data.name) {
                            out = event.name;
                        }
                    });
                    return out;
                }
            })(),
            pyEventName: (() => {
                if (from.data.type == 'http') {
                    return '';
                } else {
                    let out = '';
                    from.data.fromServer.forEach((event) => {
                        if (event.class == data.name) {
                            out = event.name;
                        }
                    });
                    from.data.fromClient.forEach((event) => {
                        if (event.class == data.name) {
                            out = event.name;
                        }
                    });
                    return this.toPyEventName(out);
                }
            })(),
        };
    }

    private buildField(name: string, data: RawField): Field {
        return {
            tsName: name,
            tsType: this.buildTsType(data),
            pyName: this.toPyName(name),
            pyType: this.buildPyType(data),
            description: data.description == null ? [] : data.description.split('\n'),
            pyConstructor: this.buildPyConstructor(name, data),
            pyToJson: this.buildPyToJson(name, data),
        };
    }

    private buildTsType(data: RawField): string {
        if (data.type == 'int' || data.type == 'float') {
            return 'number';
        }
        if (data.type == 'boolean') {
            return 'boolean';
        }
        if (data.type == 'string') {
            return 'string';
        }
        if (data.type == 'list') {
            return `${this.buildTsType(data.item)}[]`;
        }
        if (data.type == 'object') {
            return data.class;
        }
        return 'any';
    }

    private buildPyType(data: RawField): string {
        if (data.type == 'int') {
            return 'int';
        }
        if (data.type == 'float') {
            return 'float';
        }
        if (data.type == 'boolean') {
            return 'bool';
        }
        if (data.type == 'string') {
            return 'str';
        }
        if (data.type == 'list') {
            return `List[${this.buildPyType(data.item)}]`;
        }
        if (data.type == 'object') {
            return data.class;
        }
        return 'Any';
    }

    private buildPyConstructor(name: string, data: RawField): string {
        if (data.type == 'list') {
            const template1 = `        temp__0 = data['${name}']\n`;
            const template2 = `        out__0 = []\n`;
            const temp = this.buildListConstructor(data.item, 0);
            const template3 = `        out.${this.toPyName(name)} = out__0\n`;
            return template1 + template2 + temp + template3;
        }
        if (data.type == 'object') {
            return `        out.${this.toPyName(name)} = ${data.class}(data['${name}'])\n`;
        }
        return `        out.${this.toPyName(name)} = data['${name}']\n`;
    }

    private buildListConstructor(data: RawField, depth: number): string {
        if (data.type == 'list') {
            const template1 = `        for temp__${depth + 1} in temp__${depth}:\n`;
            const template2 = `            out__${depth + 1} = []\n`;
            const temp = this.buildListConstructor(data.item, depth + 1).replace(/(^|\n)/g, '$1    ');
            const template3 = `            out__${depth}.append(out__${depth + 1})\n`;
            return template1 + template2 + temp + template3;
        }
        if (data.type == 'object') {
            const template1 = `        for temp__${depth + 1} in temp__${depth}:\n`;
            const template2 = `            out__${depth}.append(${data.class}(temp__${depth + 1}))\n`;
            return template1 + template2;
        }
        const template1 = `        for temp__${depth + 1} in temp__${depth}:\n`;
        const template2 = `            out__${depth}.append(temp__${depth + 1})\n`;
        return template1 + template2;
    }

    private buildPyToJson(name: string, data: RawField): string {
        if (data.type == 'list') {
            const template1 = `            temp__0 = self.__res__${this.toPyName(name)}\n`;
            const template2 = `            out__0 = []\n`;
            const temp = this.buildListToJson(data.item, 0);
            const template3 = `            out['${name}'] = out__0\n`;
            return template1 + template2 + temp + template3;
        }
        if (data.type == 'object') {
            return `            out['${name}'] = self.__res__${this.toPyName(name)}.to_json()`;
        }
        return `            out['${name}'] = self.__res__${this.toPyName(name)}`;
    }
    private buildListToJson(data: RawField, depth: number): string {
        if (data.type == 'list') {
            const template1 = `            for temp__${depth + 1} in temp__${depth}:\n`;
            const template2 = `                out__${depth + 1} = []\n`;
            const temp = this.buildListToJson(data.item, depth + 1).replace(/(^|\n)/g, '$1    ');
            const template3 = `                out__${depth}.append(out__${depth + 1})\n`;
            return template1 + template2 + temp + template3;
        }
        if (data.type == 'object') {
            const template1 = `            for temp__${depth + 1} in temp__${depth}:\n`;
            const template2 = `                out__${depth}.append(temp__${depth + 1}.to_json())\n`;
            return template1 + template2;
        }
        const template1 = `            for temp__${depth + 1} in temp__${depth}:\n`;
        const template2 = `                out__${depth}.append(temp__${depth + 1})\n`;
        return template1 + template2;
    }
}
