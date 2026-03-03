'use client';

interface Video {
  id: string;
  title: string;
  description: string;
}

const videos: Video[] = [
  {
    id: 'OpeqwV3DfXQ',
    title: 'Bares',
    description: 'Official clip.',
  },
  {
    id: 'ADO13YB4PQQ',
    title: 'Raw Delivery',
    description: 'Official clip.',
  },
  {
    id: 'v83hQhbP5Uo',
    title: 'Красная точка',
    description: 'Official clip.',
  },
  {
    id: 'ibM1m_zyRyI',
    title: 'DRYFACE',
    description: 'Official clip.',
  },
  {
    id: 'WLh7WVN83aA',
    title: 'Бумбокс',
    description: 'Official clip.',
  },
];

export default function Videos() {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <div key={video.id} className="bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
