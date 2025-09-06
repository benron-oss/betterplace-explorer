
import React from 'react';
import { SearchResults } from '../types';
import OrganisationCard from './OrganisationCard';
import ProjectCard from './ProjectCard';
import FundraisingEventCard from './FundraisingEventCard';

interface ResultsDisplayProps {
  results: SearchResults;
}

const ResultsSection = <T,>({ title, items, CardComponent }: {
    title: string;
    items: T[];
    CardComponent: React.ComponentType<{ item: T }>;
}) => {
  if (items.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-brand-green pb-2 mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item: any) => (
          <CardComponent key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

// Wrapper components to match the expected prop name in ResultsSection
const OrgCardWrapper: React.FC<{ item: any }> = ({ item }) => <OrganisationCard organisation={item} />;
const ProjCardWrapper: React.FC<{ item: any }> = ({ item }) => <ProjectCard project={item} />;
const EventCardWrapper: React.FC<{ item: any }> = ({ item }) => <FundraisingEventCard event={item} />;

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  return (
    <div className="w-full">
      <ResultsSection
        title="Organisations"
        items={results.organisations}
        CardComponent={OrgCardWrapper}
      />
      <ResultsSection
        title="Projects"
        items={results.projects}
        CardComponent={ProjCardWrapper}
      />
      <ResultsSection
        title="Fundraising Events"
        items={results.fundraisingEvents}
        CardComponent={EventCardWrapper}
      />
    </div>
  );
};

export default ResultsDisplay;
