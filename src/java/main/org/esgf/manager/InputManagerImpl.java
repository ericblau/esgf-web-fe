package org.esgf.manager;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.util.StringUtils;

import esg.search.query.api.FacetProfile;
import esg.search.query.api.SearchInput;
import esg.search.query.api.SearchOutput;
import esg.search.query.api.SearchService;
import esg.search.query.impl.solr.SearchInputImpl;

public class InputManagerImpl implements InputManager{

    private FacetProfile facetProfile;
    private HttpServletRequest request;
    private SearchInputImpl input;
    
    
     private final static Logger LOG = Logger.getLogger(InputManagerImpl.class);
    
     /**
      * Manages how the query will be constructed before calling solr
      * Includes: geospatial search (centroid filter)
      * 
      * Coming soon includes: temporal search
      *                       facet (currently hardcoded in SearchController)
      * 
      * @author john.harney
      *
      */
    public InputManagerImpl(FacetProfile facetProfile,
                                  HttpServletRequest request) throws Exception
    {
            
        this.facetProfile = facetProfile;
        this.request = request;
        this.input = new SearchInputImpl();
        
            
    }
    
    //come back to this
    /**
     * Method to input the facet profile
     * 
     * Note: currently under development
     */
    public void inputFacetProfile()
    {
        // security note: loop ONLY over parameters in facet profile
        for (final String parName : facetProfile.getTopLevelFacets().keySet()) {
            final String[] parValues = request.getParameterValues(parName);
            if (parValues!=null) {
                for (final String parValue : parValues) {
                    if (StringUtils.hasText(parValue)) {
                        input.addConstraint(parName, parValue);
                        if (LOG.isTraceEnabled()) 
                            LOG.trace("formBackingObject: set constraint name=" +
                                    parName+" value="+parValue);
                    }
                }
            }
            
        }
    }
    
    /**
     * Method to input the geospatial constraints
     * 
     * There are two different types of searches:
     * 1 - Encloses
     * 2 - Overlaps
     * 
     * Encloses implies an AND relationship between the extreme lat/lon points.  
     * All data must be contained WITHIN those extreme points
     * 
     * Overlaps implies an OR relationship.  Specifically there are 9 different cases
     * in which an overlap may occur.
     * 
     */
    public void inputGeospatialConstraints()
    {
        

        if(request.getParameterValues("searchType")!=null)
        {
            
            
            /*
             * "Encloses" feature implemented here
             */
            if(request.getParameterValues("searchType")[0].equals("Encloses"))
            {
                //LOG.debug("Encloses");
                if(request.getParameterValues("west_degrees")!=null &&
                           request.getParameterValues("east_degrees")!=null &&
                           request.getParameterValues("north_degrees")!=null &&
                           request.getParameterValues("south_degrees")!=null)
                {
                    String geoString = "";
                    
                    String boundingboxWD = "";
                    String boundingboxED = "";
                    String boundingboxSD = "";
                    String boundingboxND = "";
                    
                    boundingboxWD = request.getParameterValues("west_degrees")[0];
                    boundingboxED = request.getParameterValues("east_degrees")[0];
                    boundingboxSD = request.getParameterValues("south_degrees")[0];
                    boundingboxND = request.getParameterValues("north_degrees")[0];
                    
                    geoString += "west_degrees:[" + boundingboxWD + " TO *] AND ";
                    geoString += "east_degrees:[* TO " + boundingboxED + "] AND ";
                    geoString += "north_degrees:[* TO " + boundingboxND + "] AND ";
                    geoString += "south_degrees:[" + boundingboxSD + " TO *]";
                    
                    //only input if a geo spatial search was created...
                    if(!boundingboxND.equals("") && 
                               !boundingboxSD.equals("") &&
                               !boundingboxED.equals("") && 
                               !boundingboxWD.equals(""))
                    input.addGeospatialRangeConstraint(geoString);
                    
                    LOG.debug("GeoStringEncloses: " + geoString);

                }
                
                
            }
            /*
             * "Overlaps" feature implemented here
             */
            else
            {
                LOG.debug("Overlaps");
                //Logic: if ANY of the extreme points (ne, nw, se, sw) are within the boundaries
                
                
                if(request.getParameterValues("west_degrees")!=null &&
                   request.getParameterValues("east_degrees")!=null &&
                   request.getParameterValues("north_degrees")!=null &&
                   request.getParameterValues("south_degrees")!=null)
                {
                    String boundingboxWD = "";
                    String boundingboxED = "";
                    String boundingboxSD = "";
                    String boundingboxND = "";
                    
                    boundingboxWD = request.getParameterValues("west_degrees")[0];
                    boundingboxED = request.getParameterValues("east_degrees")[0];
                    boundingboxSD = request.getParameterValues("south_degrees")[0];
                    boundingboxND = request.getParameterValues("north_degrees")[0];
                    
                    
                    String geoString = "";
                    
                    //case 1
                    //NE point in bounding box
                    geoString += "(east_degrees:[" + boundingboxWD + " TO " + boundingboxED + "] AND " +
                                 "north_degrees:[" + boundingboxSD + " TO " + boundingboxND + "])";
                    
                    geoString += " OR ";
                    
                    //case 2
                    //SE point in bounding box
                    geoString += "(east_degrees:[" + boundingboxWD + " TO " + boundingboxED + "] AND " +
                                 "south_degrees:[" + boundingboxSD + " TO " + boundingboxND + "])";
                    
                    geoString += " OR ";
                    
                    //case 3
                    //SW point in bounding box
                    geoString += "(west_degrees:[" + boundingboxWD + " TO " + boundingboxED + "] AND " +
                                 "south_degrees:[" + boundingboxSD + " TO " + boundingboxND + "])";
                    
                    
                    geoString += " OR ";
                    
                    //case 4
                    //NW point in bounding box
                    geoString += "(west_degrees:[" + boundingboxWD + " TO " + boundingboxED + "] AND " +
                                 "north_degrees:[" + boundingboxSD + " TO " + boundingboxND + "])";
        
                    geoString += " OR ";
                    
                    //case 5
                    //east degree in range and n & s are above and below respectively
                    geoString += "(east_degrees:[" + boundingboxWD + " TO " + boundingboxED + "] AND " +
                                 "south_degrees:[ * TO " + boundingboxSD + "] AND " +
                                 "north_degrees:[" + boundingboxND + " TO " + "* ])";

                    geoString += " OR ";
                    
                    //case 6
                    //west degree in range and n & s are above and below respectively
                    geoString += "(west_degrees:[" + boundingboxWD + " TO " + boundingboxED + "] AND " +
                                 "south_degrees:[ * TO " + boundingboxSD + "] AND " +
                                 "north_degrees:[" + boundingboxND + " TO " + "* ])";

                    geoString += " OR ";
                    
                    //case 7
                    //north degree in range and n & s are above and below respectively
                    geoString += "(north_degrees:[" + boundingboxSD + " TO " + boundingboxND + "] AND " +
                                 "west_degrees:[ * TO " + boundingboxWD + "] AND " +
                                 "east_degrees:[" + boundingboxED + " TO " + "* ])";

                    geoString += " OR ";
                    
                    //case 8
                    //south degree in range and n & s are above and below respectively
                    geoString += "(south_degrees:[" + boundingboxWD + " TO " + boundingboxED + "] AND " +
                                 "west_degrees:[ * TO " + boundingboxWD + "] AND " +
                                 "east_degrees:[" + boundingboxED + " TO " + "* ])";

                    geoString += " OR ";
                    
                    //case 9
                    //data box > user defined bounding box              
                    geoString += "(east_degrees:[" + boundingboxED + " TO " + " *] AND " +
                                 "west_degrees:[ * TO " + boundingboxWD + "] AND " +
                                 "south_degrees:[ * TO " + boundingboxSD + "] AND " +
                                 "north_degrees:[" + boundingboxND + " TO " + "* ])";

                    LOG.debug("GeoStringOverlaps: " + geoString);
                    
                    //only input if a geo spatial search was created...
                    if(!boundingboxND.equals("") && 
                       !boundingboxSD.equals("") &&
                       !boundingboxED.equals("") && 
                       !boundingboxWD.equals(""))
                        input.addGeospatialRangeConstraint(geoString);
                }
                
                
                
                
            }
        }
        
        
    }
    
    /**
     * Method to input the temporal constraints
     * 
     * The date is retrieved as a full date from the metadata...needs to be converted to the ISO8601 format for the datepicker
     * 
     */
    public void inputTemporalConstraints()
    {
        if((request.getParameterValues("from")!=null) 
                && 
           (request.getParameterValues("to")!=null)
           )
        {
            String [] parValuesFrom = request.getParameterValues("from");
            String [] parValuesTo = request.getParameterValues("to");

            LOG.debug("date from:\t\t" + dateToISO8601(parValuesFrom[0]));
            if(!parValuesFrom[0].equals("") || !parValuesTo[0].equals(""))
            {
                String temporalString = "";
                temporalString += "datetime_start:[" + dateToISO8601(parValuesFrom[0]) + " TO *] AND ";
                //LOG.debug("date from:\t\t" + dateToISO8601(parValuesFrom[0]));
            
                temporalString += "datetime_stop:[ * TO " + dateToISO8601(parValuesTo[0]) + "]";
                //LOG.debug("date to:\t\t" + dateToISO8601(parValuesTo[0]));
            
            
                input.addTemporalRangeConstraint(temporalString);
            
                //LOG.debug("TEMPORAL STRING: " + temporalString);
            }
            /*
            if(parValuesFrom != null && parValuesTo != null & !parValuesFrom.equals("") && !parValuesTo.equals(""))
            {
                String temporalString = "";
                temporalString += "datetime_start:[" + dateToISO8601(parValuesFrom[0]) + " TO *] AND ";
                //LOG.debug("date from:\t\t" + dateToISO8601(parValuesFrom[0]));
            
                temporalString += "datetime_stop:[ * TO " + dateToISO8601(parValuesTo[0]) + "]";
                //LOG.debug("date to:\t\t" + dateToISO8601(parValuesTo[0]));
            
            
                input.addTemporalRangeConstraint(temporalString);
            
                //LOG.debug("TEMPORAL STRING: " + temporalString);
            }
            */
        }
    }
    
    /**
     * Method returns the input to the SearchController
     * 
     */
    public SearchInputImpl getInput()
    {
        return this.input;
    }
    
    
    
    /**
     * Static method returns the input to the SearchController
     * @param parValue time in full date format
     */
    private static String dateToISO8601(String parValue)
    {
        String theDate = "";
        
        if(parValue.equals(""))
        {
            theDate = "*";
        }
        else
        {
            String [] tokens = parValue.split("-");
            String year = tokens[0] + "-";
            String month = tokens[1] + "-";
            String day = tokens[2];
            String time = "T12:00:00Z";
            theDate = year + month + day + time;
        }  
        return theDate;
    }
    
}