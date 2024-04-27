import type { Disruption, Stop } from "@prisma/client";

export interface ISettings {
    provider: "idfm";
    type: string;
    lineId: string;
    stopId: string;
}

export interface IProvider {
    name: string;
    short_name: string;
    description: string;
    color: string;
    types: {
        [type: string]: {
            transportmode: string;
            transportsubmode: string;
        }
    }
}

export interface IProviderLineReferenceRow {
    "id_line": string;
    "name_line": string;
    "shortname_line": string;
    "transportmode": string;
    "transportsubmode": string;
    "operatorref": string;
    "operatorname": string;
    "additionaloperators": string;
    "networkname": string;
    "colourweb_hexa": string;
    "textcolourweb_hexa": string;
    "accessibility": string;
    "id_groupoflines": string;
    "shortname_groupoflines": string;
    "status": string;
    "privatecode": string;
};

export type IProviderLineReference = IProviderLineReferenceRow[];

export interface IProviderStopsReferenceRow {
    "id": string;
    "route_long_name": string;
    "stop_id": string;
    "stop_name": string;
    "stop_lon": string;
    "stop_lat": string;
    "operatorname": string;
    "pointgeo": {
        "lon": number,
        "lat": number,
    },
    "nom_commune": string;
    "code_insee": string;
};

export type IProviderStopsReference = IProviderStopsReferenceRow[];

export interface IMonitoringResponse {
    info: {
        name: string
    };
    arrivals: {
        lineId: string
        destinationId: string
        destinationName: string
        expectedArrivalTime: string
    }[];
    destinations: string[];
}

export type ILineStopsResponse = ILineStopsResponseRow[];
export interface ILineStopsResponseRow extends Stop {
    arrivals: {
        destinationDisplay: string;
    }[];
}

export type IMessagesResponse = IMessagesResponseRow[];
export interface IMessagesResponseRow extends Disruption {
    impactedLines: {
        id: string;
    }[]
}
