export interface RawClass {
    name: string;
    description?: string;
    fields: ClassProperties;
}

export type RawField = BasicProperty | ListProperty | ObjectProperty;

type ClassProperties = Record<string, RawField>;

interface BasicProperty {
    type: 'int' | 'float' | 'string' | 'boolean';
    description?: string;
}

interface ListProperty {
    type: 'list';
    description?: string;
    item: RawField;
}

interface ObjectProperty {
    type: 'object';
    description?: string;
    class: string;
}

interface HTTPApiRaw {
    type: 'http';
    classes: RawClass[];
    serverSolver: {
        package: string;
        function: string;
    };
    path: string;
    request: string;
    response: string;
}

interface WSApiRaw {
    type: 'ws';
    classes: RawClass[];
    serverSolver: {
        package: string;
        function: string;
    };
    fromClient: {
        name: string;
        class: string;
    }[];
    fromServer: {
        name: string;
        class: string;
    }[];
}

export type RawData = HTTPApiRaw | WSApiRaw;
