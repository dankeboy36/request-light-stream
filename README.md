# request-light


[![npm Package](https://img.shields.io/npm/v/request-light.svg?style=flat-square)](https://www.npmjs.org/package/request-light)
[![NPM Downloads](https://img.shields.io/npm/dm/request-light.svg)](https://npmjs.org/package/request-light)
[![Build Status](https://github.com/microsoft/node-request-light/workflows/Tests/badge.svg)](https://github.com/microsoft/node-request-light/workflows/Tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight request library intended to be used by VSCode extensions.
- NodeJS and browser main entry points
- proxy support: Use `configure` or `HTTP_PROXY` and `HTTPS_PROXY` env variables to configure the HTTP proxy addresses.
- `ReadableStream` response `body` ([microsoft/node-request-light#34](https://github.com/microsoft/node-request-light/issues/34)).

```ts
import { xhr, XHRResponse, getErrorStatusDescription } from 'request-light';

const headers = { 'Accept-Encoding': 'gzip, deflate' };
return xhr({ url: url, followRedirects: 5, headers }).then(response => {
    return response.responseText;
}, (error: XHRResponse) => {
    throw new Error(error.responseText || getErrorStatusDescription(error.status) || error.toString());
});
```

`node/client.ts`:
```ts
import { Readable } from 'node:stream'
import { xhr } from 'request-light';

const response = await xhr({ url: url, responseType: 'stream' });
const readable = Readable.fromWeb(response.body);

let data = '';
for await (const chunk of readable) {
    data += chunk;
}
```

`browser/client.ts`:
```ts
const response = await xhr({ url: url, responseType: 'stream' });
const reader = response.body.getReader();

let done: boolean, value: Uint8Array | undefined;
let data = '';
while (!done) {
    ({ done, value } = await reader.read());
    if (value) {
        data += new TextDecoder().decode(value);
    }
}
```