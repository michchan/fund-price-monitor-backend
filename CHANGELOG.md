# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.72.1](https://github.com/michchan/fund-price-monitor-backend/compare/v0.72.0...v0.72.1) (2025-03-08)

## [0.72.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.71.0...v0.72.0) (2024-12-23)

## [0.71.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.70.2...v0.71.0) (2024-05-04)


### Features

* list single fund records by tenor ([ae0148e](https://github.com/michchan/fund-price-monitor-backend/commit/ae0148e53309eadfb0540e62f99b6f504b0f9e66))

### [0.70.2](https://github.com/michchan/fund-price-monitor-backend/compare/v0.70.1...v0.70.2) (2024-03-26)


### Bug Fixes

* create quarter table 7 days before month end to fix week spanned over 2 months issue ([f9df168](https://github.com/michchan/fund-price-monitor-backend/commit/f9df1685220ce4e70e936279f03ba678f4a9519f))

### [0.70.1](https://github.com/michchan/fund-price-monitor-backend/compare/v0.70.0...v0.70.1) (2023-12-28)


### Bug Fixes

* all scrapers are disabled ([674992b](https://github.com/michchan/fund-price-monitor-backend/commit/674992be4f131ddd0a3607d19ffe4294d063a148))

## [0.70.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.69.0...v0.70.0) (2023-12-26)

## [0.69.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.68.3...v0.69.0) (2023-04-10)


### Features

* update hsbc mpf scrapers as per site updates ([93a07b1](https://github.com/michchan/fund-price-monitor-backend/commit/93a07b18d999300aa5bf27269051ccab88d43ce8))

### [0.68.3](https://github.com/michchan/fund-price-monitor-backend/compare/v0.68.2...v0.68.3) (2022-12-01)


### Bug Fixes

* `month start at 0` should be handled in `parseWeekPeriodParam` ([74d7d51](https://github.com/michchan/fund-price-monitor-backend/commit/74d7d5108321668bb09eb571da8315d41a3cfae7))

### [0.68.2](https://github.com/michchan/fund-price-monitor-backend/compare/v0.68.1...v0.68.2) (2022-12-01)


### Features

* add log strem url to log notifer ([ab5a37d](https://github.com/michchan/fund-price-monitor-backend/commit/ab5a37de936a7542b1f247d9176bee37ae3d0bff))


### Bug Fixes

* error should have info ([78a231f](https://github.com/michchan/fund-price-monitor-backend/commit/78a231f2cbd641b7cfcdbe5d2c3bb37cefaf14c6))

### [0.68.1](https://github.com/michchan/fund-price-monitor-backend/compare/v0.68.0...v0.68.1) (2022-07-03)


### Bug Fixes

* make `IS_TEST` optional for aggregate ([20bbd77](https://github.com/michchan/fund-price-monitor-backend/commit/20bbd7706c76b619cb482b4afd7418e17bd9599f))

## [0.68.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.67.1...v0.68.0) (2022-07-03)


### Features

* update table of previous quarter capacity mode to 'on-demand' ([bae664d](https://github.com/michchan/fund-price-monitor-backend/commit/bae664d77ff2f10f41dc2e5e47f4fee94c8a80f8))


### Bug Fixes

* manulife scraper code with "/" issue ([bc52633](https://github.com/michchan/fund-price-monitor-backend/commit/bc52633a1f09a83c2f72d2941ca8f8aa0bc6e994))

### [0.67.1](https://github.com/michchan/fund-price-monitor-backend/compare/v0.67.0...v0.67.1) (2022-03-29)


### Bug Fixes

* HSBC mpf risk level unknown ([c37ab4b](https://github.com/michchan/fund-price-monitor-backend/commit/c37ab4b9dea0aa2646061d13f1544d7ea0a25156))

## [0.67.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.66.0...v0.67.0) (2022-03-28)


### Features

* add hsbcMPFScrapers ([2869932](https://github.com/michchan/fund-price-monitor-backend/commit/2869932f2791e23ecdf2a5ef4fa678283ab9a045))

## [0.66.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.65.3...v0.66.0) (2022-03-27)


### Bug Fixes

* manulife MPF some details missing after site upgrade; refractor with scrapeDetails ([18f1f73](https://github.com/michchan/fund-price-monitor-backend/commit/18f1f73fac43a0a470fd810527b47338e34f5db9))

### [0.65.3](https://github.com/michchan/fund-price-monitor-backend/compare/v0.65.2...v0.65.3) (2022-03-27)

### [0.65.2](https://github.com/michchan/fund-price-monitor-backend/compare/v0.65.0...v0.65.2) (2022-03-21)


### Bug Fixes

* puppeteer to support node 14 ([a7dec68](https://github.com/michchan/fund-price-monitor-backend/commit/a7dec688c9f4d224437e8e145b5aaa2176e92850))

## [0.65.0](https://github.com/michchan/fund-price-monitor-backend/compare/v0.64.11...v0.65.0) (2022-03-20)


### Bug Fixes

* eslint errors ([8a2d0a0](https://github.com/michchan/fund-price-monitor-backend/commit/8a2d0a013e1e4162ddd166f641a74d15e31e6799))

### [0.64.11](https://github.com/michchan/fund-price-monitor-backend/compare/v0.64.10...v0.64.11) (2022-03-19)

### [0.64.10](https://github.com/michchan/fund-price-monitor-backend/compare/v0.64.9...v0.64.10) (2022-03-19)


### Bug Fixes

* type errors ([aa726e5](https://github.com/michchan/fund-price-monitor-backend/commit/aa726e54e8d3039e84f86fe2b19af8db50d031ae))

### [0.64.9](https://github.com/michchan/fund-price-monitor-backend/compare/v0.64.8...v0.64.9) (2022-03-19)

### [0.64.8](https://github.com/michchan/fund-price-monitor-backend/compare/v0.64.7...v0.64.8) (2022-03-16)


### Bug Fixes

* install missing standard-version ([88da6f4](https://github.com/michchan/fund-price-monitor-backend/commit/88da6f431820c2e63bee16451fa36b5b500d9c2d))
* manulifeMPFScrapers not working after page upgrade ([f39bff4](https://github.com/michchan/fund-price-monitor-backend/commit/f39bff49a49550b0575b52c41af001585b091a78))
* npm audit fix ([3587368](https://github.com/michchan/fund-price-monitor-backend/commit/3587368f59c8f8510d91e0b0a43fc0f4f6adbfb6))

### [0.64.7](https://github.com/michchan/fund-price-monitor-backend/compare/v0.64.6...v0.64.7) (2022-02-27)
