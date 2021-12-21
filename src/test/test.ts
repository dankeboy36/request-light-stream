'use strict'

import test from 'ava';

import { xhr, configure } from '../..';
import { createServer, createSecureServer, createProxy, createSecureProxy } from './utils';
import { AddressInfo } from 'net';
import { promises as fs } from 'fs';
import { join } from 'path';
import { IncomingMessage, ServerResponse } from 'http';

test('text content', async t => {
    const testContent = JSON.stringify({ hello: 1, world: true})

    const server = await createServer();
    server.on('request', (req, res) => res.end(testContent));

    const serverAddress = server.address() as AddressInfo;

    const response = await xhr({ url: `http://${serverAddress.address}:${serverAddress.port}` });

    t.is(response.responseText, testContent);
    t.is(response.body.toString(), testContent);
    t.is(response.status, 200);

    server.close();
});

test('binary content', async t => {
    const server = await createServer();

    const binary = await fs.readFile(join(__dirname, '..', '..', 'src', 'test', 'test.png'));

    server.on('request', (req, res) => res.end(binary));

    const serverAddress = server.address() as AddressInfo;

    const response = await xhr({ url: `http://${serverAddress.address}:${serverAddress.port}` });

    t.deepEqual(response.body, binary);
    t.is(response.status, 200);

    server.close();
});


test('proxy http to http', async t => {
    const server = await createServer();
    const proxy = await createProxy();
    server.on('request', (req, res) => res.end('ok'));

    const proxyAddress = proxy.address() as AddressInfo;

    configure(`http://${proxyAddress.address}:${proxyAddress.port}`, false);

    const serverAddress = server.address() as AddressInfo;

    const response = await xhr({ url: `http://${serverAddress.address}:${serverAddress.port}` });

    t.is(response.responseText, 'ok');
    t.is(response.status, 200);

    server.close();
    proxy.close();
});

test('invalid proxy http to http', async t => {
    const server = await createServer();
    const proxy = await createProxy();
    server.on('request', (req, res) => res.end('ok'));

    const invalidProxyAddress = {
        address: '192.168.29.165',
        port: '808'
    }

    configure(`http://${invalidProxyAddress.address}:${invalidProxyAddress.port}`, false);

    const serverAddress = server.address() as AddressInfo;

    await xhr({ url: `http://${serverAddress.address}:${serverAddress.port}` }).catch((response) => {
        t.deepEqual(response.responseText, 'Unable to connect to http://' + `${serverAddress.address}` + ':' + `${serverAddress.port}` + ' through a proxy . Error: connect ECONNREFUSED 192.168.29.165:808');
        t.is(response.status, 404);
    });
    server.close();
    proxy.close();
});


test('proxy https to https', async t => {
    const server = await createSecureServer();
    const proxy = await createSecureProxy();
    server.on('request', (req, res) => res.end('ok'))

    const proxyAddress = proxy.address() as AddressInfo;

    configure(`https://${proxyAddress.address}:${proxyAddress.port}`, false);

    const serverAddress = server.address() as AddressInfo;

    const response = await xhr({ url: `https://${serverAddress.address}:${serverAddress.port}` });

    t.is(response.responseText, 'ok');
    t.is(response.status, 200);

    server.close();
    proxy.close();
});

test('relative redirect', async t => {
    const server = await createServer();

    server.on('request', (req: IncomingMessage, res: ServerResponse) => {
        if (req.url.includes('/foo')) {
            res.setHeader('Location', '/bar');
            res.statusCode = 301;
            res.end();
        }
        if (req.url.includes('/bar')) {
            res.end('Bar');
        }
    });

    const serverAddress = server.address() as AddressInfo;

    const response = await xhr({ url: `http://${serverAddress.address}:${serverAddress.port}/foo` });

    t.deepEqual(response.body.toString(), 'Bar');
    t.is(response.status, 200);

    server.close();
});
