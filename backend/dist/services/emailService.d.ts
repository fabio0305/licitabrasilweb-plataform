interface BiddingEmailData {
    biddingTitle: string;
    biddingNumber: string;
    openingDate: Date;
    closingDate: Date;
    estimatedValue: number;
    publicEntityName: string;
    biddingUrl: string;
}
interface ProposalEmailData {
    biddingTitle: string;
    supplierName: string;
    proposalValue: number;
    submissionDate: Date;
    proposalUrl: string;
}
declare class EmailService {
    private static instance;
    private transporter;
    private constructor();
    static getInstance(): EmailService;
    private sendEmail;
    private generateNewBiddingEmailTemplate;
    private generateProposalReceivedEmailTemplate;
    sendNewBiddingEmail(supplierEmails: string[], biddingData: BiddingEmailData): Promise<boolean>;
    sendProposalReceivedEmail(publicEntityEmail: string, proposalData: ProposalEmailData): Promise<boolean>;
    sendBiddingClosingSoonEmail(participantEmails: string[], biddingTitle: string, hoursLeft: number, biddingUrl: string): Promise<boolean>;
    sendWelcomeEmail(userEmail: string, userName: string, userRole: string): Promise<boolean>;
    testEmailConfiguration(): Promise<boolean>;
}
export default EmailService;
//# sourceMappingURL=emailService.d.ts.map