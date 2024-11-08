import { XMLParser, XMLBuilder } from 'fast-xml-parser';

class TradingNetService {
  constructor() {
    this.parser = new XMLParser();
    this.builder = new XMLBuilder();
    this.baseUrl = process.env.TRADING_NET_API_URL || 'https://api.tradingnet.gov.kl';
    this.apiKey = process.env.TRADING_NET_API_KEY || 'demo-key';
  }

  // Convert internal data format to TradingNet EDI format
  formatEDIMessage(data, messageType) {
    switch (messageType) {
      case 'CUSDEC': // Customs Declaration
        return {
          InterchangeHeader: {
            Sender: 'OCEANIA_PORT',
            Receiver: 'TRADING_NET',
            DateTime: new Date().toISOString(),
            MessageType: 'CUSDEC',
          },
          Declaration: {
            DeclarationType: data.type,
            ConsignorDetails: {
              Name: data.shipper,
              Address: data.shipperAddress,
              Country: data.originCountry
            },
            ConsigneeDetails: {
              Name: data.consignee,
              Address: data.consigneeAddress,
              Country: 'KANGAROOLAND'
            },
            GoodsDetails: {
              HSCode: data.hsCode,
              Description: data.description,
              Quantity: data.quantity,
              Value: data.value,
              Currency: data.currency
            },
            TransportDetails: {
              VesselName: data.vessel,
              VoyageNumber: data.voyageNumber,
              ContainerNumbers: data.containerNumbers
            }
          }
        };

      case 'CARGMAN': // Cargo Manifest
        return {
          InterchangeHeader: {
            Sender: 'OCEANIA_PORT',
            Receiver: 'TRADING_NET',
            DateTime: new Date().toISOString(),
            MessageType: 'CARGMAN'
          },
          CargoManifest: {
            VesselDetails: {
              VesselName: data.vessel,
              VoyageNumber: data.voyageNumber,
              ETA: data.eta
            },
            CargoDetails: data.cargoItems.map(item => ({
              BillOfLading: item.bolNumber,
              ContainerNumber: item.containerNumber,
              SealNumber: item.sealNumber,
              HSCode: item.hsCode,
              Description: item.description,
              Quantity: item.quantity,
              Weight: item.weight,
              Measurement: item.measurement
            }))
          }
        };

      default:
        throw new Error(`Unsupported message type: ${messageType}`);
    }
  }

  // Send EDI message to TradingNet
  async sendEDIMessage(formattedMessage) {
    try {
      const xmlMessage = this.builder.build(formattedMessage);
      
      // Simulated API call - in production, this would be a real API endpoint
      // For demo purposes, we'll simulate a successful response
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Simulate successful response
      return {
        InterchangeHeader: {
          MessageType: 'CUSRES',
          MessageId: `MSG${Date.now()}`,
          Timestamp: new Date().toISOString(),
          Sender: 'TRADING_NET',
          Receiver: 'OCEANIA_PORT'
        },
        Response: {
          DeclarationNumber: `KL${Date.now()}`,
          ReferenceNumber: `REF${Date.now()}`,
          Status: 'APPROVED',
          ProcessingDate: new Date().toISOString().split('T')[0],
          DutyAmount: formattedMessage.Declaration?.GoodsDetails?.Value * 0.05,
          GSTAmount: formattedMessage.Declaration?.GoodsDetails?.Value * 0.1,
          Comments: 'Declaration approved - Duty assessment completed',
          CustomsOfficer: 'OFFICER123'
        }
      };
    } catch (error) {
      console.error('Error sending EDI message:', error);
      throw error;
    }
  }

  // Process responses from TradingNet
  async processResponse(response) {
    try {
      const messageType = response.InterchangeHeader.MessageType;
      
      switch (messageType) {
        case 'CUSRES':
          return this.processCustomsResponse(response);
        case 'APERAK':
          return this.processErrorResponse(response);
        case 'PERRES':
          return this.processPermitResponse(response);
        case 'CARRE':
          return this.processCargoReleaseResponse(response);
        default:
          throw new Error(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error('Error processing TradingNet response:', error);
      throw error;
    }
  }

  processCustomsResponse(response) {
    const { DeclarationNumber, Status, DutyAmount, Comments } = response.Response;
    return {
      type: 'CUSTOMS_DECLARATION',
      declarationNumber: DeclarationNumber,
      status: Status,
      dutyAmount: DutyAmount,
      comments: Comments,
      raw: response
    };
  }

  processErrorResponse(response) {
    const { Status, ErrorCode, Errors } = response.Response;
    return {
      type: 'ERROR',
      status: Status,
      errorCode: ErrorCode,
      errors: Errors.map(err => ({
        code: err.Code,
        field: err.Field,
        message: err.Description
      })),
      raw: response
    };
  }

  processPermitResponse(response) {
    const { PermitNumber, Status, IssueDate, ExpiryDate } = response.Response;
    return {
      type: 'PERMIT',
      permitNumber: PermitNumber,
      status: Status,
      issueDate: new Date(IssueDate),
      expiryDate: new Date(ExpiryDate),
      endorsements: response.Response.Endorsements,
      raw: response
    };
  }

  processCargoReleaseResponse(response) {
    const { ReleaseNumber, Status, ContainerDetails } = response.Response;
    return {
      type: 'CARGO_RELEASE',
      releaseNumber: ReleaseNumber,
      status: Status,
      containers: ContainerDetails.map(container => ({
        number: container.ContainerNumber,
        status: container.Status,
        location: container.Location,
        releaseTime: new Date(container.ReleaseTime)
      })),
      raw: response
    };
  }

  // Submit customs declaration to TradingNet
  async submitCustomsDeclaration(declarationData) {
    try {
      const formattedMessage = this.formatEDIMessage(declarationData, 'CUSDEC');
      const response = await this.sendEDIMessage(formattedMessage);
      return this.processResponse(response);
    } catch (error) {
      console.error('Error submitting customs declaration:', error);
      throw error;
    }
  }

  // Submit cargo manifest to TradingNet
  async submitCargoManifest(manifestData) {
    try {
      const formattedMessage = this.formatEDIMessage(manifestData, 'CARGMAN');
      const response = await this.sendEDIMessage(formattedMessage);
      return this.processResponse(response);
    } catch (error) {
      console.error('Error submitting cargo manifest:', error);
      throw error;
    }
  }

  // Check permit status
  async checkPermitStatus(permitNumber) {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        InterchangeHeader: {
          MessageType: 'PERRES',
          MessageId: `PER${Date.now()}`,
          Timestamp: new Date().toISOString(),
          Sender: 'TRADING_NET',
          Receiver: 'OCEANIA_PORT'
        },
        Response: {
          PermitNumber: permitNumber,
          Status: 'VALID',
          IssueDate: new Date().toISOString().split('T')[0],
          ExpiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          Type: 'IMPORT_PERMIT',
          Endorsements: []
        }
      };
    } catch (error) {
      console.error('Error checking permit status:', error);
      throw error;
    }
  }
}

export default TradingNetService;