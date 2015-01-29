'use strict';
var url = require('url');
var punycode = require('punycode');
var queryString = require('query-string');
var prependHttp = require('prepend-http');
var sortKeys = require('sort-keys');

var DEFAULT_PORTS = {
	'http:': 80,
	'https:': 443,
	'ftp:': 21
};

module.exports = function (str, options) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}
	if (!options) {
		options = {};
	}
	if (typeof options !== 'object') {
		throw new TypeError('Expected an object');
	}

	// prepend protocol
	str = prependHttp(str.trim()).replace(/^\/\//, 'http://');

	var urlObj = url.parse(str);

	// prevent these from being used by `url.format`
	delete urlObj.host;
	delete urlObj.query;

	// remove default port
	var port = DEFAULT_PORTS[urlObj.protocol];
	if (Number(urlObj.port) === port) {
		delete urlObj.port;
	}

	// IDN to Unicode
	urlObj.hostname = punycode.toUnicode(urlObj.hostname).toLowerCase();

	// remove `www.`
	if (! options.preserveHost) {
		urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
	}

	// remove URL with empty query string
	if (urlObj.search === '?') {
		delete urlObj.search;
	}

	// sort query parameters
	if (options.preserveKeyOrder) {
		urlObj.search = queryString.stringify(queryString.parse(urlObj.search));
	} else {
		urlObj.search = queryString.stringify(sortKeys(queryString.parse(urlObj.search)));
	}

	// decode query parameters
	urlObj.search = decodeURIComponent(urlObj.search);

	// take advantage of many of the Node `url` normalizations
	str = url.format(urlObj);

	// remove ending `/`
	str = str.replace(/\/$/, '');

	return str;
};
