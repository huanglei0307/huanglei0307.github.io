// src/data/cardsData.ts
export interface ICard {
    id: number;
    text: string;
    class: string;
}

export const CARDS_DATA: ICard[] = [
    // Airplane cards (10)
    { id: 1, text: "airplane flying in blue sky", class: "airplane" },
    { id: 2, text: "airplane taking off from runway", class: "airplane" },
    { id: 3, text: "airplane landing at airport", class: "airplane" },
    { id: 4, text: "airplane parked at gate", class: "airplane" },
    { id: 5, text: "airplane flying above clouds", class: "airplane" },
    { id: 6, text: "airplane at sunset", class: "airplane" },
    { id: 7, text: "airplane with landing gear down", class: "airplane" },
    { id: 8, text: "airplane flying over mountains", class: "airplane" },
    { id: 9, text: "airplane in stormy weather", class: "airplane" },
    { id: 10, text: "airplane at night with lights", class: "airplane" },
    
    // Helicopter cards (10)
    { id: 11, text: "helicopter hovering in air", class: "helicopter" },
    { id: 12, text: "helicopter landing on helipad", class: "helicopter" },
    { id: 13, text: "helicopter flying over city", class: "helicopter" },
    { id: 14, text: "helicopter on rescue mission", class: "helicopter" },
    { id: 15, text: "helicopter with open door", class: "helicopter" },
    { id: 16, text: "helicopter over water", class: "helicopter" },
    { id: 17, text: "helicopter in military camouflage", class: "helicopter" },
    { id: 18, text: "helicopter carrying cargo", class: "helicopter" },
    { id: 19, text: "helicopter flying low", class: "helicopter" },
    { id: 20, text: "helicopter at airshow", class: "helicopter" },
    
    // Airship cards (10)
    { id: 21, text: "airship floating in blue sky", class: "airship" },
    { id: 22, text: "airship with advertising banner", class: "airship" },
    { id: 23, text: "airship flying over stadium", class: "airship" },
    { id: 24, text: "airship at sunset", class: "airship" },
    { id: 25, text: "airship with colorful stripes", class: "airship" },
    { id: 26, text: "airship flying over ocean", class: "airship" },
    { id: 27, text: "airship near mountains", class: "airship" },
    { id: 28, text: "airship at night", class: "airship" },
    { id: 29, text: "airship with landing platform", class: "airship" },
    { id: 30, text: "airship in cloudy weather", class: "airship" }
];