import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';



export interface PosterVariables {
  coverUrl: string;
  headline: string;
  price: string;
  priceLabel?: string;
  location: string;
  keySpec: string;
  ctaText: string;
  agencyLogoUrl?: string;
  brandingText: string;
  urgencyText?: string;
  specChips?: string;
}

const ASPECTS = {
  '16:9': { width: 1200, height: 675 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
} as const;

@Injectable()
export class PosterService {
  private readonly logger = new Logger(PosterService.name);

  /**
   * Render an HTML template to a PNG buffer using Playwright.
   * Replaces {{variable}} placeholders with values.
   */
  async renderPoster(
    templateName: string,
    variables: PosterVariables,
  ): Promise<Buffer> {
    return this.renderPosterSingle(templateName, variables, { width: 1200, height: 675 });
  }

  /**
   * Render an HTML template to a PNG buffer with a specific viewport.
   */
  async renderPosterSingle(
    templateName: string,
    variables: PosterVariables,
    viewport: { width: number; height: number },
  ): Promise<Buffer> {
    const html = this.prepareHtml(templateName, variables);
    const browser = await this.launchBrowser();

    try {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 15_000,
      });

      // Give fonts a moment to render
      await page.waitForTimeout(1000);

      const buffer = await page.screenshot({
        type: 'png',
        fullPage: false,
      });

      await context.close();
      return buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Render a template at all 3 aspect ratios in one browser session.
   */
  async renderPosterMultiAspect(
    templateName: string,
    variables: PosterVariables,
  ): Promise<{
    bufferLandscape: Buffer;
    bufferSquare: Buffer;
    bufferPortrait: Buffer;
  }> {
    const html = this.prepareHtml(templateName, variables);
    const browser = await this.launchBrowser();

    try {
      const context = await browser.newContext({ deviceScaleFactor: 2 });

      // Render 16:9 landscape
      const pageLandscape = await context.newPage();
      await pageLandscape.setViewportSize(ASPECTS['16:9']);
      await pageLandscape.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 15_000,
      });
      await pageLandscape.waitForTimeout(800);
      const bufferLandscape = await pageLandscape.screenshot({
        type: 'png',
        fullPage: false,
      });
      await pageLandscape.close();

      // Render 1:1 square
      const pageSquare = await context.newPage();
      await pageSquare.setViewportSize(ASPECTS['1:1']);
      await pageSquare.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 15_000,
      });
      await pageSquare.waitForTimeout(800);
      const bufferSquare = await pageSquare.screenshot({
        type: 'png',
        fullPage: false,
      });
      await pageSquare.close();

      // Render 9:16 portrait
      const pagePortrait = await context.newPage();
      await pagePortrait.setViewportSize(ASPECTS['9:16']);
      await pagePortrait.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 15_000,
      });
      await pagePortrait.waitForTimeout(800);
      const bufferPortrait = await pagePortrait.screenshot({
        type: 'png',
        fullPage: false,
      });
      await pagePortrait.close();

      return { bufferLandscape, bufferSquare, bufferPortrait };
    } finally {
      await browser.close();
    }
  }

  private prepareHtml(templateName: string, variables: PosterVariables): string {
    const templatePath = resolve(
      __dirname,
      'templates',
      `${templateName}.html`,
    );

    let html: string;
    try {
      html = readFileSync(templatePath, 'utf-8');
    } catch {
      throw new InternalServerErrorException(
        `Template not found: ${templateName}`,
      );
    }

    // Replace placeholders
    html = html.replace(/\{\{coverUrl\}\}/g, variables.coverUrl);
    html = html.replace(/\{\{headline\}\}/g, this.escapeHtml(variables.headline));
    html = html.replace(/\{\{price\}\}/g, this.escapeHtml(variables.price));
    html = html.replace(/\{\{priceLabel\}\}/g, this.escapeHtml(variables.priceLabel ?? ''));
    html = html.replace(/\{\{location\}\}/g, this.escapeHtml(variables.location));
    html = html.replace(/\{\{keySpec\}\}/g, this.escapeHtml(variables.keySpec));
    html = html.replace(/\{\{ctaText\}\}/g, this.escapeHtml(variables.ctaText));
    html = html.replace(/\{\{agencyLogoUrl\}\}/g, variables.agencyLogoUrl ?? '');
    html = html.replace(/\{\{brandingText\}\}/g, this.escapeHtml(variables.brandingText));
    html = html.replace(/\{\{urgencyText\}\}/g, this.escapeHtml(variables.urgencyText ?? ''));
    html = html.replace(/\{\{specChips\}\}/g, variables.specChips ?? '');
    
    return html;
  }


  private async launchBrowser() {
    const { chromium } = require('playwright');

    try {
      return await chromium.launch({
        headless: true,
        timeout: 30_000,
        args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch (err) {
      this.logger.error('Failed to launch Playwright browser', err);
      throw new InternalServerErrorException(
        'Playwright Chromium launch failed. Ensure browsers are installed: cd backend && npx playwright install chromium',
      );
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
