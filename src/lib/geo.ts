/**
 * Utilitário para cálculo de distâncias geográficas usando a Fórmula de Haversine.
 */

interface Coordinates {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

/**
 * Calcula a distância em quilômetros entre duas coordenadas (latitude/longitude)
 * utilizando a fórmula de Haversine.
 * Retorna null caso qualquer uma das coordenadas seja inválida ou indefinida.
 */
export function calculateDistanceKm(
  coord1: Coordinates | null | undefined,
  coord2: Coordinates | null | undefined
): number | null {
  if (
    !coord1 ||
    !coord2 ||
    coord1.latitude == null ||
    coord1.longitude == null ||
    coord2.latitude == null ||
    coord2.longitude == null
  ) {
    return null;
  }

  const lat1 = Number(coord1.latitude);
  const lon1 = Number(coord1.longitude);
  const lat2 = Number(coord2.latitude);
  const lon2 = Number(coord2.longitude);

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return null;
  }

  const R = 6371; // Raio médio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Arredonda para 1 casa decimal (ex: 1.2 km)
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formata a distância para exibição amigável sem expor coordenadas exatas.
 * Exemplo: "A 1,2 km de você" ou "A menos de 1 km de você"
 */
export function formatDistance(distanceKm: number | null | undefined): string | null {
  if (distanceKm == null || isNaN(distanceKm)) return null;

  if (distanceKm < 1) {
    return 'A menos de 1 km de você';
  }

  const formatted = distanceKm.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `A ${formatted} km de você`;
}
