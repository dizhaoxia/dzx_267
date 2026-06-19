import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { UserRole } from '../models/User'

export interface JwtPayload {
  userId: number
  role: UserRole
  name: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload
}
