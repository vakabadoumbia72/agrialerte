import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignalementPayload = {
  type_pollution?: unknown;
  description?: unknown;
  nom_zone?: unknown;
  contact_signaleur?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  photo_urls?: unknown;
};

export async function POST(request: Request) {
  let payload: SignalementPayload;

  try {
    payload = (await request.json()) as SignalementPayload;
  } catch (error) {
    console.error("Signalement: impossible de lire le JSON reçu.", error);
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Le corps de la requête est invalide." }, { status: 400 });
  }

  const {
    type_pollution,
    description,
    nom_zone,
    contact_signaleur,
    latitude,
    longitude,
    photo_urls,
  } = payload;

  if (
    typeof type_pollution !== "string" ||
    !type_pollution.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof nom_zone !== "string" ||
    !nom_zone.trim()
  ) {
    return NextResponse.json(
      { error: "Les champs type_pollution, description et nom_zone sont requis." },
      { status: 400 },
    );
  }

  const photoUrls = photo_urls === undefined || photo_urls === null ? [] : photo_urls;
  if (
    !Array.isArray(photoUrls) ||
    !photoUrls.every(
      (photoUrl): photoUrl is string =>
        typeof photoUrl === "string" && photoUrl.trim().length > 0,
    )
  ) {
    return NextResponse.json(
      { error: "Le champ photo_urls doit être un tableau de chaînes de caractères." },
      { status: 400 },
    );
  }

  const hasLatitude = latitude !== null && latitude !== undefined && latitude !== "";
  const hasLongitude =
    longitude !== null && longitude !== undefined && longitude !== "";

  if (hasLatitude !== hasLongitude) {
    return NextResponse.json(
      { error: "La latitude et la longitude doivent être fournies ensemble." },
      { status: 400 },
    );
  }

  let localisation: string | null = null;
  if (hasLatitude && hasLongitude) {
    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);

    if (
      !Number.isFinite(numericLatitude) ||
      !Number.isFinite(numericLongitude) ||
      numericLatitude < -90 ||
      numericLatitude > 90 ||
      numericLongitude < -180 ||
      numericLongitude > 180
    ) {
      return NextResponse.json(
        { error: "Coordonnées géographiques invalides." },
        { status: 400 },
      );
    }

    // EWKT uses X/Y order: longitude first, then latitude.
    localisation = `SRID=4326;POINT(${numericLongitude} ${numericLatitude})`;
  }

  let data: { id: string | number } | null = null;
  let error: { message: string; code?: string } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase
      .from("signalements")
      .insert({
        type_pollution: type_pollution.trim(),
        description: description.trim(),
        nom_zone: nom_zone.trim(),
        contact_signaleur:
          typeof contact_signaleur === "string" && contact_signaleur.trim()
            ? contact_signaleur.trim()
            : null,
        photo_urls: photoUrls.map((photoUrl) => photoUrl.trim()),
        localisation,
      })
      .select("id")
      .single();
    data = result.data;
    error = result.error;
  } catch (requestError) {
    console.error("Signalement: erreur inattendue lors de l'insertion.", requestError);
    return NextResponse.json(
      { error: "Le service de signalement est temporairement indisponible." },
      { status: 503 },
    );
  }

  if (error) {
    console.error("Signalement: insertion Supabase refusée.", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Impossible d'enregistrer le signalement. Vérifiez les politiques RLS de la table signalements." },
      { status: 500 },
    );
  }

  if (!data) {
    console.error("Signalement: Supabase n'a renvoyé aucun identifiant.");
    return NextResponse.json({ error: "Réponse invalide du service de signalement." }, { status: 502 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
