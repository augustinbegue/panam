/**
 * BEGIN SIRI API
 */

export interface SiriResponse {
    Siri: Siri
}

export interface Siri {
    ServiceDelivery: ServiceDelivery
}

export interface ServiceDelivery {
    ResponseTimestamp: string
    ProducerRef: string
    ResponseMessageIdentifier: string
    StopMonitoringDelivery: StopMonitoringDelivery[]
    GeneralMessageDelivery: GeneralMessageDelivery[]
    EstimatedTimetableDelivery: EstimatedTimetableDelivery[]
}

export interface EstimatedTimetableDelivery {
    ResponseTimestamp: string
    Version: string
    Status: string
    EstimatedJourneyVersionFrame: EstimatedJourneyVersionFrame[]
}

export interface EstimatedJourneyVersionFrame {
    EstimatedVehicleJourney: EstimatedVehicleJourney[]
}

export interface EstimatedVehicleJourney {
    RecordedAtTime: string
    LineRef: LineRef
    DirectionRef: DirectionRef
    DatedVehicleJourneyRef: DatedVehicleJourneyRef
    VehicleMode: string[]
    RouteRef: RouteRef
    PublishedLineName: PublishedLineName[]
    DirectionName: DirectionName[]
    OriginRef: OriginRef
    OriginName: OriginName[]
    DestinationRef: DestinationRef
    DestinationName: DestinationName[]
    OperatorRef: OperatorRef
    ProductCategoryRef: ProductCategoryRef
    JourneyNote: JourneyNote[]
    FirstOrLastJourney: string
    EstimatedCalls: EstimatedCalls
    VehicleJourneyName: VehicleJourneyName[]
}

export interface DirectionRef {
    value?: string
}

export interface DatedVehicleJourneyRef {
    value: string
}

export interface RouteRef {
    value?: string
}

export interface PublishedLineName {
    value: string
}

export interface DirectionName {
    value: string
}

export interface OriginRef {
    value?: string
}

export interface OriginName {
    value: string
}

export interface DestinationRef {
    value: string
}

export interface DestinationName {
    value: string
}

export interface OperatorRef {
    value?: string
}

export interface ProductCategoryRef { }

export interface JourneyNote {
    value: string
}

export interface EstimatedCalls {
    EstimatedCall: EstimatedCall[]
}

export interface EstimatedCall {
    StopPointRef: StopPointRef
    ExpectedDepartureTime?: string
    DestinationDisplay: DestinationDisplay[]
    DepartureStatus?: string
    ExpectedArrivalTime?: string
    AimedArrivalTime?: string
    ArrivalStatus?: string
    AimedDepartureTime?: string
    ArrivalPlatformName?: ArrivalPlatformName
    ArrivalProximityText?: ArrivalProximityText
}

export interface StopPointRef {
    value: string
}

export interface DestinationDisplay {
    value: string
}

export interface ArrivalPlatformName {
    value: string
}

export interface ArrivalProximityText {
    value: string
}

export interface VehicleJourneyName {
    value: string
}


export interface StopMonitoringDelivery {
    ResponseTimestamp: string
    Version: string
    Status: string
    MonitoredStopVisit: MonitoredStopVisit[]
}

export interface MonitoredStopVisit {
    RecordedAtTime: string
    ItemIdentifier: string
    MonitoringRef: MonitoringRef
    MonitoredVehicleJourney: MonitoredVehicleJourney
}

export interface MonitoringRef {
    value: string
}

export interface MonitoredVehicleJourney {
    LineRef: LineRef
    OperatorRef: OperatorRef
    FramedVehicleJourneyRef: FramedVehicleJourneyRef
    DirectionName: any[]
    DestinationRef: DestinationRef
    DestinationName: DestinationName[]
    VehicleJourneyName: any[]
    JourneyNote: JourneyNote[]
    MonitoredCall: MonitoredCall
    TrainNumbers: TrainNumbers
}

export interface LineRef {
    value: string
}

export interface OperatorRef {
    value: string
}

export interface FramedVehicleJourneyRef {
    DataFrameRef: DataFrameRef
    DatedVehicleJourneyRef: string
}

export interface DataFrameRef {
    value: string
}

export interface DestinationRef {
    value: string
}

export interface DestinationName {
    value: string
}

export interface JourneyNote {
    value: string
}

export interface MonitoredCall {
    StopPointName: StopPointName[]
    VehicleAtStop: boolean
    DestinationDisplay: DestinationDisplay[]
    ExpectedArrivalTime?: string
    ExpectedDepartureTime?: string
    DepartureStatus: string
    Order: number
    AimedArrivalTime: string
    ArrivalPlatformName: ArrivalPlatformName
    AimedDepartureTime: string
    ArrivalStatus: string
}

export interface StopPointName {
    value: string
}

export interface DestinationDisplay {
    value: string
}

export interface ArrivalPlatformName {
    value: string
}

export interface TrainNumbers {
    TrainNumberRef: TrainNumberRef[]
}

export interface TrainNumberRef {
    value: string
}

export interface GeneralMessageDelivery {
    ResponseTimestamp: string
    Version: string
    Status: string
    InfoMessage: InfoMessage[]
}

export interface InfoMessage {
    FormatRef: string
    RecordedAtTime: string
    ItemIdentifier: string
    InfoMessageIdentifier: InfoMessageIdentifier
    InfoChannelRef: InfoChannelRef
    ValidUntilTime: string
    Content: Content
}

export interface InfoMessageIdentifier {
    value: string
}

export interface InfoChannelRef {
    value: string
}

export interface Content {
    LineRef: LineRef[]
    Message: Message[]
}

export interface Message {
    MessageType: string
    MessageText: MessageText
}

export interface MessageText {
    value: string
    lang: string
}

/**
 *  ===========================================================================
 *  BEGIN DISRUPTIONS API
 *  ===========================================================================
 */

export interface DisruptionsResponse {
    disruptions: Disruption[]
    lines: Line[]
    lastUpdatedDate: string
}

export interface Disruption {
    id: string
    applicationPeriods: ApplicationPeriod[]
    lastUpdate: string
    cause: string
    severity: string
    title: string
    message: string
    tags?: string[]
}

export interface ApplicationPeriod {
    begin: string
    end: string
}

export interface Line {
    id: string
    name: string
    shortName: string
    mode: string
    networkId: string
    impactedObjects: ImpactedObject[]
}

export interface ImpactedObject {
    type: string
    id: string
    name: string
    disruptionIds: string[]
}
