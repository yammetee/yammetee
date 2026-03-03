export interface ReleaseTrack {
  id: string;
  title: string;
  artist: string;
  audio: string;
  lyrics?: string;
}

export interface Release {
  id: string;
  title: string;
  artist: string;
  cover: string;
  releaseDate: string;
  releaseType: string;
  tracks: ReleaseTrack[];
}

export interface ReleaseRegistryItem {
  id: string;
  dataFile: string;
}
