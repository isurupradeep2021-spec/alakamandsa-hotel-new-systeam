import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.from = `"Alakamandsa Hotel" <${user ?? 'noreply@alakamandsa.lk'}>`;

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async sendSlaAlert(opts: {
    to: string;
    staffName: string;
    type: 'housekeeping' | 'maintenance';
    taskId: number;
    roomNumber: string;
    deadline: Date;
    description: string;
  }): Promise<void> {
    const typeLabel = opts.type === 'housekeeping' ? 'Housekeeping Task' : 'Maintenance Ticket';
    const deadlineStr = opts.deadline.toLocaleString('en-LK', { timeZone: 'Asia/Colombo' });

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#c0392b">⚠️ SLA Overdue Alert — ${typeLabel}</h2>
        <p>Hi <strong>${opts.staffName}</strong>,</p>
        <p>The following ${typeLabel.toLowerCase()} assigned to you is <strong>overdue</strong>:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><th style="text-align:left;padding:6px 10px;background:#f4f4f4">ID</th><td style="padding:6px 10px">#${opts.taskId}</td></tr>
          <tr><th style="text-align:left;padding:6px 10px;background:#f4f4f4">Room</th><td style="padding:6px 10px">${opts.roomNumber}</td></tr>
          <tr><th style="text-align:left;padding:6px 10px;background:#f4f4f4">Description</th><td style="padding:6px 10px">${opts.description}</td></tr>
          <tr><th style="text-align:left;padding:6px 10px;background:#f4f4f4">Deadline</th><td style="padding:6px 10px;color:#c0392b"><strong>${deadlineStr}</strong></td></tr>
        </table>
        <p style="margin-top:16px">Please complete or escalate this task as soon as possible.</p>
        <hr style="border:none;border-top:1px solid #eee;margin-top:24px">
        <p style="color:#999;font-size:12px">Alakamandsa Hotel — Room Operations System</p>
      </div>`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: `[SLA Alert] Overdue ${typeLabel} — Room ${opts.roomNumber} (#${opts.taskId})`,
        html,
      });
      this.logger.log(`SLA alert sent to ${opts.to} for ${typeLabel} #${opts.taskId}`);
    } catch (err) {
      this.logger.error(`Failed to send SLA alert to ${opts.to}: ${(err as Error).message}`);
    }
  }
}
