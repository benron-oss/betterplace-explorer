import React from 'react';
import { Project } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const platformLink = project.links.find(link => link.rel === 'platform')?.href;
  const totalDonations = project.donated_amount_in_cents ?? project.donations_total_in_cents ?? 0;
  const incompleteNeeds = project.incomplete_need_count ?? project.incomplete_needs_count ?? 0;

  const getBorderColorClass = () => {
    if (project.donations_prohibited) {
      return 'border-l-red-500'; // Red for blocked
    }
    if (project.closed_at) {
      return 'border-l-gray-400'; // Gray for closed
    }
    return 'border-l-green-500'; // Green for open
  };

  const borderColorClass = getBorderColorClass();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col border-l-4 ${borderColorClass}`}>
      <div className="flex-grow">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-xl font-bold text-gray-800">
            {platformLink ? (
              <a
                href={platformLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-blue hover:underline"
              >
                {project.title}
              </a>
            ) : (
              project.title
            )}
          </h3>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {project.donations_prohibited && (
              <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap text-red-600 bg-red-100">
                Donations Blocked
              </span>
            )}
            {project.closed_at && (
              <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap text-gray-600 bg-gray-100">
                Closed: {formatDate(project.closed_at)}
              </span>
            )}
            {!project.donations_prohibited && !project.closed_at && (
              <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap text-green-600 bg-green-100">
                Open
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">ID: {project.id}</p>
        {project.carrier && (
          <p className="text-gray-700 mt-4">
            <span className="font-semibold">Carrier:</span> {project.carrier.name}
          </p>
        )}
        {project.contact && (
          <p className="text-gray-700 mt-1">
            <span className="font-semibold">Contact:</span>{' '}
            <a
              href={`https://www.betterplace.org/de/backoffice/users/${project.contact.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              {project.contact.name}
            </a>{' '}
            (ID: {project.contact.id})
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
                <p className="text-sm text-gray-500">Total Donations</p>
                <p className="font-bold text-lg text-brand-green">{formatCurrency(totalDonations)}</p>
            </div>
            {incompleteNeeds > 0 ? (
                 <div>
                    <p className="text-sm text-gray-500">Incomplete Needs</p>
                    <p className="font-bold text-lg text-orange-500">{incompleteNeeds}</p>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-bold text-lg text-blue-600">
                        Financed
                        {project.completed_at && (
                            <span className="block text-xs font-normal text-gray-500">{formatDate(project.completed_at)}</span>
                        )}
                    </p>
                </div>
            )}
        </div>
        {(project.activated_at || project.updated_at) && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
            {project.activated_at && (
              <p>
                <span className="font-semibold text-gray-600">Activated:</span> {formatDate(project.activated_at)}
              </p>
            )}
            {project.updated_at && (
              <p className="mt-1">
                <span className="font-semibold text-gray-600">Last Updated:</span> {formatDate(project.updated_at)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;