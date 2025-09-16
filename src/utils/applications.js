export const sortApplications = (applications = []) =>
  [...applications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

export const statusCounts = (applications = []) => {
  return applications.reduce(
    (acc, application) => {
      const key = application.status || 'Applied';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );
};

export const applicationsByPlatform = (applications = []) => {
  return applications.reduce((acc, application) => {
    const key = application.platform || 'Other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

export const recentApplications = (applications = [], limit = 4) =>
  sortApplications(applications).slice(0, limit);

export const applicationsPerDay = (applications = [], days = 7) => {
  const today = new Date();
  const result = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    const label = day.toISOString().slice(5, 10);
    const count = applications.filter((app) => {
      const appDate = new Date(app.date);
      return (
        appDate.getFullYear() === day.getFullYear() &&
        appDate.getMonth() === day.getMonth() &&
        appDate.getDate() === day.getDate()
      );
    }).length;
    result.push({ day: label, count });
  }
  return result;
};
