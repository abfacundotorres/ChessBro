import { buildCards } from '../engine/repertoire'
import { REPERTOIRE } from './repertoire'

/** Tarjetas de repaso de todo el repertorio (se calculan una vez). Un test garantiza que no hay conflictos. */
export const REP_CARDS = buildCards(REPERTOIRE).cards
