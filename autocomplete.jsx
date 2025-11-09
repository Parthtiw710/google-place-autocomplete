"use client";

import React, { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

export function Autocomplete({ children }) {
  const inputRef = useRef(null);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [value, setValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLEMAPS_API_KEY,
    libraries,
  });

  // Load google services
  useEffect(() => {
    if (!isLoaded || !window.google) return;
    setAutocompleteService(new window.google.maps.places.AutocompleteService());
    const mapDiv = document.createElement("div");
    setPlacesService(new window.google.maps.places.PlacesService(mapDiv));
  }, [isLoaded]);

  // Clone input to control value + autocomplete dropdown
  const clonedInput = React.Children.map(children, (child) =>
    React.cloneElement(child, {
      ref: inputRef,
      value,
      onChange: (e) => {
        const v = e.target.value;
        setValue(v);
        if (v && autocompleteService) {
          autocompleteService.getPlacePredictions({ input: v }, (res, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              res
            ) {
              setPredictions(res);
              setShowDropdown(true);
            } else {
              setPredictions([]);
              setShowDropdown(false);
            }
          });
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
        // allow external onChange if passed
        if (child.props.onChange) child.props.onChange(e);
      },
      onFocus: () => value && setShowDropdown(true),
    })
  );

  // ✅ Handle selecting a prediction (this was missing!)
  const handleSelect = (prediction) => {
    if (!placesService) return;

    const placeName = prediction.description;
    setValue(placeName);
    setShowDropdown(false);

    // ✅ Send selected value to parent input (HeroBookRide)
    if (typeof children.props.onSelect === "function") {
      children.props.onSelect(placeName);
    }

    // get full details silently (not required but safe)
    placesService.getDetails({ placeId: prediction.place_id }, () => {});
  };

  return (
    <div className="relative w-full mx-auto">
      {clonedInput}

      {showDropdown && predictions.length > 0 && (
        <div className="absolute top-[45px] left-0 w-full bg-white rounded-xl border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden z-1000">
          {predictions.map((p) => (
            <div
              key={p.place_id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p)}
              className="flex items-start gap-2.5 px-4 py-2.5 cursor-pointer border-b border-[#f2f2f2] hover:bg-gray-50 transition"
            >
              <div className="bg-[#f3f3f3] rounded-full w-7 h-7 flex items-center justify-center mt-0.5 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 stroke-black stroke-2 [stroke-linecap:round] [stroke-linejoin:round] fill-none"
                >
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="md:text-xl sm:text-lg text-md font-medium text-[#111] leading-[1.2]">
                  {p.structured_formatting.main_text}
                </div>
                <div className="sm:text-md text-sm text-gray-500 mt-0.5 leading-[1.3]">
                  {p.structured_formatting.secondary_text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
