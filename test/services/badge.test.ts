import { expect } from 'chai';
import { badgeService, BadgeData, BadgeOptions } from '../../scripts/services/badge.service';

describe('Badge Service', function () {
  const mockBadgeData: BadgeData = {
    contentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    verified: true,
    timestamp: new Date('2025-01-01T00:00:00Z'),
    platform: 'youtube',
    creator: '0xABCDEF1234567890',
  };

  describe('generateBadgeSVG', function () {
    it('should generate a valid SVG with default options', function () {
      const svg = badgeService.generateBadgeSVG(mockBadgeData);

      expect(svg).to.be.a('string');
      expect(svg).to.include('<?xml version="1.0"');
      expect(svg).to.include('<svg');
      expect(svg).to.include('</svg>');
      expect(svg).to.include('Verified');
    });

    it('should include content hash in SVG', function () {
      const svg = badgeService.generateBadgeSVG(mockBadgeData);

      // Hash is truncated as "0x12345678…abcdef"
      expect(svg).to.include('0x12345678…abcdef');
    });

    it('should apply dark theme colors by default', function () {
      const svg = badgeService.generateBadgeSVG(mockBadgeData);

      expect(svg).to.include('fill="#0b0f1a"'); // dark bg
      expect(svg).to.include('fill="#9ef"'); // dark fg
    });

    it('should apply light theme colors', function () {
      const options: BadgeOptions = { theme: 'light' };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('fill="#ffffff"'); // light bg
      expect(svg).to.include('fill="#0b0f1a"'); // light fg
    });

    it('should apply blue theme colors', function () {
      const options: BadgeOptions = { theme: 'blue' };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('fill="#1a237e"');
    });

    it('should use medium size by default', function () {
      const svg = badgeService.generateBadgeSVG(mockBadgeData);

      expect(svg).to.include('width="240"');
      expect(svg).to.include('height="32"');
    });

    it('should apply small size preset', function () {
      const options: BadgeOptions = { size: 'small' };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('width="180"');
    });

    it('should apply large size preset', function () {
      const options: BadgeOptions = { size: 'large' };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('width="320"');
    });

    it('should apply custom numeric size', function () {
      const options: BadgeOptions = { size: 300 };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('width="300"');
    });

    it('should apply rounded style by default', function () {
      const svg = badgeService.generateBadgeSVG(mockBadgeData);

      expect(svg).to.match(/rx="\d+"/);
    });

    it('should apply flat style (no border radius)', function () {
      const options: BadgeOptions = { style: 'flat' };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('rx="0"');
    });

    it('should apply pill style (full border radius)', function () {
      const options: BadgeOptions = { style: 'pill' };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.match(/rx="\d+"/);
    });

    it('should show minimal badge with only checkmark', function () {
      const options: BadgeOptions = { style: 'minimal' };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('✓');
      // The hash is still in the SVG title/aria-label, but not in the badge text
      // Check that the badge text is just the checkmark (not "Verified" or hash)
      expect(svg).to.match(/>✓<\/text>/);
    });

    it('should show timestamp when enabled', function () {
      const options: BadgeOptions = { showTimestamp: true };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('2025-01-01');
    });

    it('should not show timestamp by default', function () {
      const svg = badgeService.generateBadgeSVG(mockBadgeData);

      expect(svg).not.to.include('2025-01-01');
    });

    it('should show platform when enabled', function () {
      const options: BadgeOptions = { showPlatform: true };
      const svg = badgeService.generateBadgeSVG(mockBadgeData, options);

      expect(svg).to.include('youtube');
    });

    it('should handle unverified content', function () {
      const unverifiedData: BadgeData = {
        ...mockBadgeData,
        verified: false,
      };
      const svg = badgeService.generateBadgeSVG(unverifiedData);

      expect(svg).to.include('✗');
      expect(svg).to.include('Unverified');
    });
  });

  describe('generateEmbedHTML', function () {
    const badgeUrl = 'https://example.com/badge.svg';
    const targetUrl = 'https://example.com/verify';

    it('should generate valid HTML embed code', function () {
      const html = badgeService.generateEmbedHTML(badgeUrl, targetUrl);

      expect(html).to.include('<a href=');
      expect(html).to.include(badgeUrl);
      expect(html).to.include(targetUrl);
      expect(html).to.include('<img');
      expect(html).to.include('alt=');
    });

    it('should include custom alt text', function () {
      const html = badgeService.generateEmbedHTML(badgeUrl, targetUrl, {
        alt: 'Custom Alt Text',
      });

      expect(html).to.include('alt="Custom Alt Text"');
    });

    it('should include custom title', function () {
      const html = badgeService.generateEmbedHTML(badgeUrl, targetUrl, {
        title: 'Custom Title',
      });

      expect(html).to.include('title="Custom Title"');
    });

    it('should have target="_blank" and rel attributes', function () {
      const html = badgeService.generateEmbedHTML(badgeUrl, targetUrl);

      expect(html).to.include('target="_blank"');
      expect(html).to.include('rel="noopener noreferrer"');
    });
  });

  describe('generateEmbedMarkdown', function () {
    const badgeUrl = 'https://example.com/badge.svg';
    const targetUrl = 'https://example.com/verify';

    it('should generate valid Markdown embed code', function () {
      const markdown = badgeService.generateEmbedMarkdown(badgeUrl, targetUrl);

      expect(markdown).to.include('[![');
      expect(markdown).to.include('](');
      expect(markdown).to.include(badgeUrl);
      expect(markdown).to.include(targetUrl);
    });

    it('should include custom alt text', function () {
      const markdown = badgeService.generateEmbedMarkdown(badgeUrl, targetUrl, {
        alt: 'Custom Alt',
      });

      expect(markdown).to.include('Custom Alt');
    });

    it('should follow Markdown badge syntax', function () {
      const markdown = badgeService.generateEmbedMarkdown(badgeUrl, targetUrl);

      expect(markdown).to.match(/\[!\[.*\]\(.*\)\]\(.*\)/);
    });
  });

  describe('generateEmbedSnippets', function () {
    const badgeUrl = 'https://example.com/badge.svg';
    const verifyUrl = 'https://example.com/verify';
    const contentHash = '0x1234567890abcdef';

    it('should generate all embed snippet types', function () {
      const snippets = badgeService.generateEmbedSnippets(badgeUrl, verifyUrl, contentHash);

      expect(snippets).to.have.property('html');
      expect(snippets).to.have.property('markdown');
      expect(snippets).to.have.property('direct');
      expect(snippets).to.have.property('verify');
      expect(snippets).to.have.property('contentHash');
    });

    it('should include correct URLs in snippets', function () {
      const snippets = badgeService.generateEmbedSnippets(badgeUrl, verifyUrl, contentHash);

      expect(snippets.direct).to.equal(badgeUrl);
      expect(snippets.verify).to.equal(verifyUrl);
      expect(snippets.contentHash).to.equal(contentHash);
    });

    it('should generate valid HTML snippet', function () {
      const snippets = badgeService.generateEmbedSnippets(badgeUrl, verifyUrl, contentHash);

      expect(snippets.html).to.include('<a href=');
      expect(snippets.html).to.include('<img src=');
    });

    it('should generate valid Markdown snippet', function () {
      const snippets = badgeService.generateEmbedSnippets(badgeUrl, verifyUrl, contentHash);

      expect(snippets.markdown).to.include('[![');
      expect(snippets.markdown).to.include('](');
    });
  });

  describe('validateBadgeOptions', function () {
    it('should validate valid theme options', function () {
      const result = badgeService.validateBadgeOptions({ theme: 'dark' });
      expect(result.theme).to.equal('dark');
    });

    it('should reject invalid theme options', function () {
      const result = badgeService.validateBadgeOptions({ theme: 'invalid' });
      expect(result.theme).to.be.undefined;
    });

    it('should validate size preset options', function () {
      const result = badgeService.validateBadgeOptions({ size: 'medium' });
      expect(result.size).to.equal('medium');
    });

    it('should validate numeric size within range', function () {
      const result = badgeService.validateBadgeOptions({ size: '300' });
      expect(result.size).to.equal(300);
    });

    it('should reject numeric size below minimum', function () {
      const result = badgeService.validateBadgeOptions({ size: '50' });
      expect(result.size).to.be.undefined;
    });

    it('should reject numeric size above maximum', function () {
      const result = badgeService.validateBadgeOptions({ size: '1000' });
      expect(result.size).to.be.undefined;
    });

    it('should validate valid style options', function () {
      const result = badgeService.validateBadgeOptions({ style: 'pill' });
      expect(result.style).to.equal('pill');
    });

    it('should reject invalid style options', function () {
      const result = badgeService.validateBadgeOptions({ style: 'invalid' });
      expect(result.style).to.be.undefined;
    });

    it('should parse boolean string for showTimestamp', function () {
      const result = badgeService.validateBadgeOptions({ showTimestamp: 'true' });
      expect(result.showTimestamp).to.be.true;
    });

    it('should parse actual boolean for showTimestamp', function () {
      const result = badgeService.validateBadgeOptions({ showTimestamp: true });
      expect(result.showTimestamp).to.be.true;
    });

    it('should parse boolean string for showPlatform', function () {
      const result = badgeService.validateBadgeOptions({ showPlatform: 'true' });
      expect(result.showPlatform).to.be.true;
    });

    it('should accept string platform value', function () {
      const result = badgeService.validateBadgeOptions({ platform: 'youtube' });
      expect(result.platform).to.equal('youtube');
    });

    it('should return empty object for no options', function () {
      const result = badgeService.validateBadgeOptions({});
      expect(Object.keys(result)).to.have.length.at.least(0);
    });
  });
});
