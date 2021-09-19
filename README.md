# FinTen API

To request filing data you must be authenticated. Authentication is
sessionless, works with JWT (JSON Web Tokens).
For every request, you must send this token. You can request a new token at any
time.

## Create an account

You can create a free account at [weirwood.ai](https://weirwood.ai/login).

## Login

Get an authentication token to access protected endpoints.

Structure of the request:
* **Method**: POST
* **URL**: `https://finten.weirwood.ai/users/login`
* **Headers**:
  * **Content-Type**: application/x-www-form-urlencoded
* **Body**:
  * username
  * password

Response status:
* `200`: OK
* `400`: invalid credentials

In case of `200`, the response is a JSON object with the following properties:
* `username`: your username
* `email`: your email
* `isPremium`: the preimum status
* `token`: the JWT token to validate your requests

Include the token in all your requests.

### Examples

#### Bash
```bash
curl --location --request POST 'https://finten.weirwood.ai/users/login' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'username=YOUR_USERNAME' \
  --data-urlencode 'password=YOUR_PASSWORD'
```

#### Python
```python
import requests

url = "https://finten.weirwood.ai/users/login"

payload='username=YOUR_USERNAME&password=YOUR_PASSWORD'
headers = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)
```

## Filings

Returns all the filings for the specified company.

Structure of the request:
* **Method**: GET
* **URL**: `https://finten.weirwood.ai/company/filings?ticker={TICKER}`
* **Headers**:
  * Authorization: Bearer token
* **URL Params**:
  * ticker: the ticker of the company you want to get filings from; must be one
      of the tickers returned by the '/tickers' endpoint.

Response status:
* `200`: OK
* `400`: Bad request, ticker not present
* `401`: Unauthorized (check your authentication token)
* `403`: Forbidden, the requested ticker cannot be accessed

In case of `200`, the response is a JSON object with the following properties:
* `ticker`: the requested ticker
* `filings`: an array of JSON objects representing each of the filings
* `companyInfo`: general information about the company

### Examples

#### Bash
```bash
curl --location --request GET 'https://finten.weirwood.ai/company/filings?ticker=NVDA' \
  --header 'Authorization: Bearer YOUR_TOKEN_HERE'
```

#### Python
```python
import requests

url = "https://finten.weirwood.ai/company/filings?ticker=NVDA"

payload={}
headers = {
  'Authorization': 'Bearer YOUR_TOKEN_HERE'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)
```

## Tickers

Returns all the tickers that can be queried.

Structure of the request:
* **Method**: GET
* **URL**: `https://finten.weirwood.ai/company/tickers`

Response status:
* `200`: OK

In case of `200`, the response is a JSON object with the following properties:
* **tickers**: a list with all the tickers available

### Examples

#### Bash
```bash
curl --location --request GET 'https://finten.weirwood.ai/company/tickers'
```

#### Python
```python
import requests

url = "https://finten.weirwood.ai/company/tickers"

response = requests.request("GET", url)

print(response.text)
```
