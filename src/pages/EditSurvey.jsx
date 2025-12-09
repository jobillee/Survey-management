import React from 'react';
import { useParams } from 'react-router-dom';
import SurveyCreate from './SurveyCreate';

const EditSurvey = () => {
  const { id } = useParams();
  return <SurveyCreate id={id} />;
};

export default EditSurvey;
