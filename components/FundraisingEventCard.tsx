
import React from 'react';
import { FundraisingEventWithProjects } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface FundraisingEventCardProps {
  event: FundraisingEventWithProjects;
}

const getStatus = (event: FundraisingEventWithProjects): { text: string; color: string } => {
    if (event.closed_at) {
        return { text: `Closed: ${formatDate(event.closed_at)}`, color: 'text-gray-600 bg-gray-100' };
    }
    return { text: 'Open', color: 'text-green-600 bg-green-100' };
};

const FundraisingEventCard: React.FC<FundraisingEventCardProps> = ({ event }) => {
  const platformLink = event.links.find(link => link.rel === 'platform')?.href;
  const status = getStatus(event);
  const totalDonations = event.donated_amount_in_cents ?? event.donations_total_in_cents ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col">
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-800 pr-2">
            {platformLink ? (
              <a
                href={platformLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-blue hover:underline"
              >
                {event.title}
              </a>
            ) : (
              event.title
            )}
          </h3>
           <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>
            {status.text}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">ID: {event.id}</p>
        
        {event.contact && (
          <p className="text-gray-700 mt-4">
            <span className="font-semibold">Contact:</span>{' '}
            <a
              href={`https://www.betterplace.org/de/backoffice/users/${event.contact.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              {event.contact.name}
            </a>{' '}
            (ID: {event.contact.id})
          </p>
        )}

        <div className="mt-4">
            <p className="text-sm text-gray-500">Total Donations</p>
            <p className="font-bold text-lg text-brand-green">{formatCurrency(totalDonations)}</p>
        </div>
        
        {event.featuredProjects.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-700">Featured Projects:</h4>
            <ul className="list-disc list-inside text-gray-600 mt-1 text-sm">
              {event.featuredProjects.map(p => (
                <li key={p.id}>{p.title}</li>
              ))}
            </ul>
          </div>
        )}
        
        {(event.created_at || event.updated_at) && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
            {event.created_at && (
              <p>
                <span className="font-semibold text-gray-600">Created:</span> {formatDate(event.created_at)}
              </p>
            )}
            {event.updated_at && (
              <p className="mt-1">
                <span className="font-semibold text-gray-600">Last Updated:</span> {formatDate(event.updated_at)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FundraisingEventCard;
