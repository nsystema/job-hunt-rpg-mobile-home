import { useCallback, useMemo, useState } from 'react';

const DEFAULT_SORT = 'Newest';

const sortApplications = (list, sortKey) => {
  const working = [...list];
  switch (sortKey) {
    case 'Oldest':
      working.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      break;
    case 'Company A-Z':
      working.sort((a, b) => {
        const compare = a.company.localeCompare(b.company);
        if (compare !== 0) {
          return compare;
        }
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
      break;
    case 'Favorites first':
      working.sort(
        (a, b) =>
          (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) ||
          new Date(b.date || 0) - new Date(a.date || 0),
      );
      break;
    default:
      working.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }
  return working;
};

export const useApplicationFilters = (applications = []) => {
  const [appsQuery, setAppsQuery] = useState('');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterPlatforms, setFilterPlatforms] = useState([]);
  const [sortKey, setSortKey] = useState(DEFAULT_SORT);

  const filteredApps = useMemo(() => {
    let list = Array.isArray(applications) ? [...applications] : [];
    const query = appsQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((app) =>
        `${app.company} ${app.role} ${app.platform}`.toLowerCase().includes(query),
      );
    }
    if (filterStatuses.length) {
      list = list.filter((app) => filterStatuses.includes(app.status));
    }
    if (filterPlatforms.length) {
      list = list.filter((app) => filterPlatforms.includes(app.platform));
    }
    return sortApplications(list, sortKey);
  }, [applications, appsQuery, filterStatuses, filterPlatforms, sortKey]);

  const toggleFilterStatus = useCallback((value) => {
    setFilterStatuses((list) =>
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }, []);

  const toggleFilterPlatform = useCallback((value) => {
    setFilterPlatforms((list) =>
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilterStatuses([]);
    setFilterPlatforms([]);
  }, []);

  return {
    appsQuery,
    setAppsQuery,
    filterStatuses,
    toggleFilterStatus,
    filterPlatforms,
    toggleFilterPlatform,
    clearFilters,
    sortKey,
    setSortKey,
    filteredApps,
  };
};
