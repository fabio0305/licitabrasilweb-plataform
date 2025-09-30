"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../utils/logger");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    async sendEmail(options) {
        try {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
                logger_1.logger.warn('Configurações de email não encontradas. Email não enviado.');
                return false;
            }
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.SMTP_USER,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments,
            };
            const info = await this.transporter.sendMail(mailOptions);
            logger_1.logger.info(`Email enviado com sucesso: ${info.messageId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Erro ao enviar email:', error);
            return false;
        }
    }
    generateNewBiddingEmailTemplate(data) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nova Licitação Disponível</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #1976d2; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ LicitaBrasil Web</h1>
            <h2>Nova Licitação Disponível</h2>
          </div>
          
          <div class="content">
            <p>Uma nova licitação foi publicada e está disponível para participação:</p>
            
            <div class="info-box">
              <h3>${data.biddingTitle}</h3>
              <p><strong>Número:</strong> ${data.biddingNumber}</p>
              <p><strong>Órgão:</strong> ${data.publicEntityName}</p>
              <p><strong>Valor Estimado:</strong> R$ ${data.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>Abertura:</strong> ${data.openingDate.toLocaleDateString('pt-BR')} às ${data.openingDate.toLocaleTimeString('pt-BR')}</p>
              <p><strong>Fechamento:</strong> ${data.closingDate.toLocaleDateString('pt-BR')} às ${data.closingDate.toLocaleTimeString('pt-BR')}</p>
            </div>
            
            <p>Não perca esta oportunidade! Acesse a plataforma para visualizar todos os detalhes e enviar sua proposta.</p>
            
            <a href="${data.biddingUrl}" class="button">Ver Licitação</a>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Não responda a esta mensagem.</p>
            <p>LicitaBrasil Web - Transparência e Eficiência em Licitações Públicas</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateProposalReceivedEmailTemplate(data) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nova Proposta Recebida</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2e7d32; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2e7d32; }
          .button { display: inline-block; background: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ LicitaBrasil Web</h1>
            <h2>Nova Proposta Recebida</h2>
          </div>
          
          <div class="content">
            <p>Uma nova proposta foi submetida para sua licitação:</p>
            
            <div class="info-box">
              <h3>${data.biddingTitle}</h3>
              <p><strong>Fornecedor:</strong> ${data.supplierName}</p>
              <p><strong>Valor da Proposta:</strong> R$ ${data.proposalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>Data de Submissão:</strong> ${data.submissionDate.toLocaleDateString('pt-BR')} às ${data.submissionDate.toLocaleTimeString('pt-BR')}</p>
            </div>
            
            <p>Acesse a plataforma para analisar a proposta e tomar as ações necessárias.</p>
            
            <a href="${data.proposalUrl}" class="button">Analisar Proposta</a>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Não responda a esta mensagem.</p>
            <p>LicitaBrasil Web - Transparência e Eficiência em Licitações Públicas</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    async sendNewBiddingEmail(supplierEmails, biddingData) {
        const html = this.generateNewBiddingEmailTemplate(biddingData);
        return await this.sendEmail({
            to: supplierEmails,
            subject: `Nova Licitação: ${biddingData.biddingTitle}`,
            html,
        });
    }
    async sendProposalReceivedEmail(publicEntityEmail, proposalData) {
        const html = this.generateProposalReceivedEmailTemplate(proposalData);
        return await this.sendEmail({
            to: publicEntityEmail,
            subject: `Nova Proposta Recebida: ${proposalData.biddingTitle}`,
            html,
        });
    }
    async sendBiddingClosingSoonEmail(participantEmails, biddingTitle, hoursLeft, biddingUrl) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Licitação Fechando em Breve</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f57c00; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .warning-box { background: #fff3e0; padding: 15px; margin: 10px 0; border-left: 4px solid #f57c00; }
          .button { display: inline-block; background: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Licitação Fechando em Breve</h1>
          </div>
          
          <div class="content">
            <div class="warning-box">
              <h3>${biddingTitle}</h3>
              <p><strong>⏰ ATENÇÃO:</strong> Esta licitação fecha em <strong>${hoursLeft} horas</strong>!</p>
              <p>Certifique-se de que sua proposta está completa e submetida antes do prazo final.</p>
            </div>
            
            <a href="${biddingUrl}" class="button">Acessar Licitação</a>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Não responda a esta mensagem.</p>
            <p>LicitaBrasil Web - Transparência e Eficiência em Licitações Públicas</p>
          </div>
        </div>
      </body>
      </html>
    `;
        return await this.sendEmail({
            to: participantEmails,
            subject: `⚠️ Licitação fechando em ${hoursLeft}h: ${biddingTitle}`,
            html,
        });
    }
    async sendWelcomeEmail(userEmail, userName, userRole) {
        const roleNames = {
            SUPPLIER: 'Fornecedor',
            PUBLIC_ENTITY: 'Órgão Público',
            ADMIN: 'Administrador',
            AUDITOR: 'Auditor',
        };
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo ao LicitaBrasil Web</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .welcome-box { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao LicitaBrasil Web!</h1>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2>Olá, ${userName}!</h2>
              <p>Seja bem-vindo à plataforma LicitaBrasil Web como <strong>${roleNames[userRole] || userRole}</strong>.</p>
              
              <p>Nossa plataforma oferece:</p>
              <ul>
                <li>✅ Transparência total nos processos licitatórios</li>
                <li>✅ Interface moderna e intuitiva</li>
                <li>✅ Notificações em tempo real</li>
                <li>✅ Documentação completa e organizada</li>
                <li>✅ Suporte especializado</li>
              </ul>
              
              <p>Comece agora mesmo a explorar as funcionalidades disponíveis!</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL}" class="button">Acessar Plataforma</a>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Não responda a esta mensagem.</p>
            <p>LicitaBrasil Web - Transparência e Eficiência em Licitações Públicas</p>
          </div>
        </div>
      </body>
      </html>
    `;
        return await this.sendEmail({
            to: userEmail,
            subject: '🎉 Bem-vindo ao LicitaBrasil Web!',
            html,
        });
    }
    async testEmailConfiguration() {
        try {
            await this.transporter.verify();
            logger_1.logger.info('Configuração de email verificada com sucesso');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Erro na configuração de email:', error);
            return false;
        }
    }
}
exports.default = EmailService;
//# sourceMappingURL=emailService.js.map