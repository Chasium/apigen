export interface Field {
    description: string[];
    tsName: string;
    tsType: string;
    pyName: string;
    pyType: string;
    pyConstructor: string;
    pyToJson: string;
}

export interface Class {
    description: string[];
    className: string;
    isReq: boolean;
    isRes: boolean;
    eventName: string;
    pyEventName: string;
    fields: Field[];
}

interface HTTPApiData {
    isHTTP: true;
    reqClass: string;
    resClass: string;
    pyReqClass: string;
    pyResClass: string;
    filePath: string;
    filePackage: string;
    solverFunction: string;
    solverPackage: string;
    apiPath: string;
    classes: Class[];
}

export interface Event {
    eventName: string;
    pyEventName: string;
    className: string;
}

interface WSApiData {
    isHTTP: false;
    reqEvents: Event[];
    resEvents: Event[];
    filePath: string;
    filePackage: string;
    solverFunction: string;
    solverPackage: string;
    classes: Class[];
}

export type ApiData = HTTPApiData | WSApiData;
