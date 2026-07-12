import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Adversarial Protocol Testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  const testSmartLinkSlug = 'test-adversarial-slug';
  let propertyId: string;
  let agentId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = app.get(PrismaService);
    
    // Seed required test data
    const user = await prisma.user.create({
      data: { email: 'adversarial@test.com', name: 'Adversarial Agent' },
    });
    agentId = user.id;

    const property = await prisma.property.create({
      data: {
        ownerUserId: agentId,
        title: 'Adversarial Property',
        propertyType: 'VILLA',
        transactionType: 'SALE',
        location: {},
        specs: {},
      },
    });
    propertyId = property.id;

    await prisma.smartLink.create({
      data: {
        slug: testSmartLinkSlug,
        propertyId: property.id,
        status: 'ACTIVE',
      },
    });

    await app.init();
  }, 30_000);

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Idempotency & Replay Semantics', () => {
    
    it('1. Replay Integrity Race Test (DB Lock Validation)', async () => {
      const idempotencyKey = 'race-condition-key-001';
      const payload = {
        slug: testSmartLinkSlug,
        name: 'Race Tester',
        phone: '1234567890',
      };

      // Fire 3 completely concurrent requests to trigger check-then-write races
      const requests = Array(3).fill(0).map(() => 
        request(app.getHttpServer())
          .post('/leads/public')
          .set('x-idempotency-key', idempotencyKey)
          .set('x-protocol-version', 'v1')
          .send(payload)
      );

      const responses = await Promise.all(requests);

      // Assert that ALL responses return 201 Created and the same leadId
      responses.forEach(res => {
        expect(res.status).toBe(201);
      });
      const firstLeadId = responses[0].body.leadId;
      expect(responses[1].body.leadId).toBe(firstLeadId);
      expect(responses[2].body.leadId).toBe(firstLeadId);

      // Assert that exactly ONE lead was created in the database
      const leadCount = await prisma.lead.count({
        where: { name: 'Race Tester' },
      });
      expect(leadCount).toBe(1);

      // Assert that exactly ONE idempotency record exists
      const idempotencyCount = await prisma.idempotentRequest.count({
        where: { idempotencyKey },
      });
      expect(idempotencyCount).toBe(1);
    });

    it('2. Retry Storm Amplification Test', async () => {
      const idempotencyKey = 'retry-storm-key-002';
      const payload = {
        slug: testSmartLinkSlug,
        name: 'Storm Tester',
        phone: '0987654321',
      };

      // Fire 20 overlapping requests simulating CDN/Middleware retry storms
      const requests = Array(20).fill(0).map(() => 
        request(app.getHttpServer())
          .post('/leads/public')
          .set('x-idempotency-key', idempotencyKey)
          .set('x-protocol-version', 'v1')
          .send(payload)
      );

      const responses = await Promise.all(requests);

      responses.forEach(res => {
        expect(res.status).toBe(201);
        expect(res.body.ok).toBe(true);
      });

      // Assert DB truth
      const leadCount = await prisma.lead.count({
        where: { name: 'Storm Tester' },
      });
      expect(leadCount).toBe(1);
    });

    it('3. Payload Hash Fuzz Test', async () => {
      const idempotencyKey = 'hash-fuzz-key-003';
      
      const payload1 = { slug: testSmartLinkSlug, name: 'Fuzz', phone: '1112223333' };
      const res1 = await request(app.getHttpServer())
        .post('/leads/public')
        .set('x-idempotency-key', idempotencyKey)
        .send(payload1)
        .expect(201);

      // Tamper the payload (simulate hostile interference or client bug)
      const payload2 = { slug: testSmartLinkSlug, name: 'Fuzz Modified', phone: '1112223333' };
      
      const res2 = await request(app.getHttpServer())
        .post('/leads/public')
        .set('x-idempotency-key', idempotencyKey)
        .send(payload2);

      // Should violently reject with 409 Conflict due to payload hash mismatch
      expect(res2.status).toBe(409);
      expect(res2.body.message).toContain('Idempotency conflict');
    });

    it('4. Lost ACK Replay Test', async () => {
      const idempotencyKey = 'lost-ack-key-004';
      const payload = {
        slug: testSmartLinkSlug,
        name: 'Lost ACK Tester',
        phone: '4445556666',
      };

      // First request (client sends but "loses" connection before reading response)
      const res1 = await request(app.getHttpServer())
        .post('/leads/public')
        .set('x-idempotency-key', idempotencyKey)
        .send(payload)
        .expect(201);

      // The mutation committed. Client reconnects and retries 5 minutes later.
      const res2 = await request(app.getHttpServer())
        .post('/leads/public')
        .set('x-idempotency-key', idempotencyKey)
        .send(payload)
        .expect(201);

      // Assert exact identical response from replay
      expect(res2.body.leadId).toBe(res1.body.leadId);
      expect(res2.body.ok).toBe(res1.body.ok);

      // Assert invariant: no duplicate mutations
      const leadCount = await prisma.lead.count({
        where: { name: 'Lost ACK Tester' },
      });
      expect(leadCount).toBe(1);
    });
  });
});
