// SPDX-FileCopyrightText: Ethazeriel <eth@ethazeriel.net>
//
// SPDX-License-Identifier: CC-BY-NC-SA-4.0

type AccessTokenResponse = {
  access_token: string,
  token_type: string,
  expires_in: number,
  refresh_token: string,
  scope: string
}

type ClientCredentialsResponse = {
  access_token: string,
  token_type: 'bearer',
  expires_in: number,
}