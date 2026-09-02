"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useMemo, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/mapbox";

import { supabase } from "@/lib/supabase";

type Signalement = {
  id: string | number;
  type_pollution: string;
  description: string;
  nom_zone: string;
  localisation: unknown;
};

type Point = Signalement & { longitude: number; latitude: number };

const pollutionColors: Record<string, string> = {
  "Eau trouble": "#38bdf8",
  "Sol décoloré": "#facc15",
  "Poissons morts": "#c084fc",
  "Récolte abîmée": "#fb923c",
  Autre: "#4ade80",
};

function getCoordinates(localisation: unknown): [number, number] | null {
  if (typeof localisation === "string") {
    const match = localisation.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
    if (match) return [Number(match[1]), Number(match[2])];
  }
  if (
    localisation &&
    typeof localisation === "object" &&
    "coordinates" in localisation &&
    Array.isArray(localisation.coordinates) &&
    localisation.coordinates.length >= 2
  ) {
    const [longitude, latitude] = localisation.coordinates;
    if (typeof longitude === "number" && typeof latitude === "number") {
      return [longitude, latitude];
    }
  }
  return null;
}

export default function DashboardMap() {
  const [signalements, setSignalements] = useState<Point[]>([]);
  const [isHeatmap, setIsHeatmap] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSignalements = async () => {
      const { data, error } = await supabase
        .from("signalements")
        .select("id, type_pollution, description, nom_zone, localisation");

      if (error) {
        setErrorMessage("Impossible de charger les signalements.");
        return;
      }

      const points = (data as Signalement[])
        .map((signalement) => {
          const coordinates = getCoordinates(signalement.localisation);
          return coordinates
            ? { ...signalement, longitude: coordinates[0], latitude: coordinates[1] }
            : null;
        })
        .filter((signalement): signalement is Point => signalement !== null);
      setSignalements(points);
    };

    void loadSignalements();
  }, []);

  const geoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: signalements.map((signalement) => ({
        type: "Feature" as const,
        properties: { type_pollution: signalement.type_pollution },
        geometry: {
          type: "Point" as const,
          coordinates: [signalement.longitude, signalement.latitude],
        },
      })),
    }),
    [signalements],
  );

  const initialView = signalements[0]
    ? { longitude: signalements[0].longitude, latitude: signalements[0].latitude, zoom: 9 }
    : { longitude: 2.35, latitude: 46.6, zoom: 4.5 };

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-green-400 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-500">
              AgriAlerte
            </p>
            <h1 className="mt-2 text-3xl font-bold text-green-300">
              Tableau de bord AgriAlerte
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIsHeatmap((value) => !value)}
            className="rounded-lg border border-green-600 px-4 py-3 font-semibold text-green-300 transition hover:bg-green-950"
          >
            {isHeatmap ? "Afficher les marqueurs" : "Afficher la carte de chaleur"}
          </button>
        </div>

        {errorMessage && <p className="mb-4 text-red-400">{errorMessage}</p>}
        <div className="overflow-hidden rounded-2xl border border-green-900 bg-zinc-950">
          <Map
            initialViewState={initialView}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            style={{ width: "100%", height: "min(70vh, 700px)" }}
          >
            <NavigationControl position="top-right" />
            {isHeatmap ? (
              <Source id="signalements-heatmap" type="geojson" data={geoJson}>
                <Layer
                  id="signalements-heat"
                  type="heatmap"
                  paint={{
                    "heatmap-intensity": 1.2,
                    "heatmap-radius": 28,
                    "heatmap-opacity": 0.85,
                  }}
                />
              </Source>
            ) : (
              signalements.map((signalement) => (
                <Marker
                  key={signalement.id}
                  longitude={signalement.longitude}
                  latitude={signalement.latitude}
                  color={pollutionColors[signalement.type_pollution] ?? "#4ade80"}
                />
              ))
            )}
          </Map>
        </div>
        <p className="mt-3 text-sm text-green-700">
          {signalements.length} signalement{signalements.length > 1 ? "s" : ""} géolocalisé
          {signalements.length > 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
