
import React from 'react';
import { Organisation } from '../types';

interface OrganisationCardProps {
  organisation: Organisation;
}

const OrganisationCard: React.FC<OrganisationCardProps> = ({ organisation }) => {
  const platformLink = organisation.links.find(link => link.rel === 'platform')?.href;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col">
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-gray-800">
          {platformLink ? (
            <a
              href={platformLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-blue hover:underline"
            >
              {organisation.name}
            </a>
          ) : (
            organisation.name
          )}
        </h3>
        <p className="text-sm text-gray-500 mt-1">ID: {organisation.id}</p>
        {organisation.contact && (
          <p className="text-gray-700 mt-4">
            <span className="font-semibold">Contact:</span>{' '}
            <a
              href={`https://www.betterplace.org/de/backoffice/users/${organisation.contact.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              {organisation.contact.name}
            </a>{' '}
            (ID: {organisation.contact.id})
          </p>
        )}
      </div>
    </div>
  );
};

export default OrganisationCard;
