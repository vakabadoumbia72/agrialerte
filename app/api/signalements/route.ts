import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

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
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
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

  if (
    photo_urls !== undefined &&
    (!Array.isArray(photo_urls) ||
      !photo_urls.every(
        (photoUrl): photoUrl is string =>
          typeof photoUrl === "string" && photoUrl.trim().length > 0,
      ))
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

    localisation = `SRID=4326;POINT(${numericLongitude} ${numericLatitude})`;
  }

  const { data, error } = await supabase
    .from("signalements")
    .insert({
      type_pollution: type_pollution.trim(),
      description: description.trim(),
      nom_zone: nom_zone.trim(),
      contact_signaleur:
        typeof contact_signaleur === "string" && contact_signaleur.trim()
          ? contact_signaleur.trim()
          : null,
      photo_urls: Array.isArray(photo_urls)
        ? photo_urls.map((photoUrl) => photoUrl.trim())
        : [],
      localisation,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Impossible d'enregistrer le signalement." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
