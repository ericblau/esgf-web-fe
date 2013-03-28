package org.esgf.srm;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class SRM_EntryDB {
    
    private static String db_name = "first_db";
    private static String table_name = "srm_entries";
    private static String valid_user = "first_user";
    private static String valid_password = "1234";
    
    private static String create_table_SQL = "create table srm_entries(file_id varchar(128),dataset_id varchar(128),timeStamp varchar(128), primary key (file_id,dataset_id));";
    
    private Connection con;
    private String dqtaset_idVal;
    
    
    public SRM_EntryDB() {
        
        
        //establish connection
        this.con = null;
        try {
            
            this.con = DriverManager.getConnection(
                    "jdbc:postgresql://127.0.0.1:5432/" + db_name, valid_user,
                    valid_password);
            
        } catch (SQLException e) {
            
            System.out.println(e.getMessage());
            System.out.println("Connection Failed! Check output console");
            
        }
    }
    
    public List<SRMEntry> getEntriesForDatasetId(String dataset_id) {
        
        List<SRMEntry> srm_entries = new ArrayList<SRMEntry>();
        
        try {
            Statement st = this.con.createStatement();
            String queryCommand = "select * from " + table_name + " where dataset_id='" + dataset_id + "';";
            System.out.println("Issuing command: " + queryCommand);
            ResultSet rs = st.executeQuery(queryCommand);
            while(rs.next()) {
                System.out.println("he");
                SRMEntry srm_entry = new SRMEntry();
                String file_idVal = (String)rs.getObject("file_id");
                String dataset_idVal = (String)rs.getObject("dataset_id");
                String timeStampVal = (String)rs.getObject("timeStamp");
                srm_entry.setFile_id(file_idVal);
                srm_entry.setDataset_id(dataset_idVal);
                srm_entry.setTimeStamp(timeStampVal);
                srm_entries.add(srm_entry);
            }
            st.close();
        } catch(Exception e) {
            
        }
        
        return srm_entries;
    }
    
    public SRMEntry getEntry(String file_id) {

        SRMEntry srm_entry = new SRMEntry();
        try {
            Statement st = this.con.createStatement();
            String queryCommand = "select * from " + table_name + " where file_id='" + file_id + "';";
            System.out.println("Issuing command: " + queryCommand);
            ResultSet rs = st.executeQuery(queryCommand);
            while(rs.next()) {
                String file_idVal = (String)rs.getObject("file_id");
                String dataset_idVal = (String)rs.getObject("dataset_id");
                String timeStampVal = (String)rs.getObject("timeStamp");
                srm_entry.setFile_id(file_idVal);
                srm_entry.setDataset_id(dataset_idVal);
                srm_entry.setTimeStamp(timeStampVal);
                
            }
            st.close();
        } catch(Exception e) {
            
        }
        return srm_entry;
    }
    
    public void addEntry(SRMEntry srm_entry) {

        Statement st = null;
        ResultSet rs = null;
        
        String updateCommand = "insert into " + table_name + " (file_id,dataset_id,timeStamp) values (" +
                                "'" + srm_entry.getFile_id() + "'," +
                                "'" + srm_entry.getDataset_id() + "'," +
                                "'" + srm_entry.getTimeStamp() + "');";
                
       
        //System.out.println("Update Command: " + updateCommand);
        if (this.con != null) {
            try {
                st = con.createStatement();
                int update = st.executeUpdate(updateCommand);
                st.close();
            } catch(SQLException e) {
                //coming here means that the db has not been built yet
                //build first then add entry
                if(!e.toString().contains("duplicate")) {
                    this.buildDB(updateCommand);
                }
            }
        } else {
            System.out.println("Not connected to the database");
        }
        
        
    }
    
    private void buildDB(String command) {
    
        
        Statement st = null;
        int update = 0;
        
        if (this.con != null) {
        
            try {
                st = con.createStatement();
                update = st.executeUpdate(create_table_SQL);
               
                //adds tuples if needed
                if(command != null) {
                    update = st.executeUpdate(command);
                    System.out.println("updating... " + update);
                }
                st.close();
                
            } catch(SQLException e) {
                e.printStackTrace();
            }
            
        }
    }
    
    public void closeConnection() {
        if(this.con != null) {
            try {
                this.con.close();
            } catch(Exception e) {
                
            }
            
        }
    }
    
    public static void main(String[] args) {

        SRM_EntryDB srm_entryDB = new SRM_EntryDB();
        
        
        SRMEntry srm_entry = new SRMEntry();
        srm_entry.setFile_id("file_id1");
        srm_entry.setDataset_id("dataset_id1");
        srm_entry.setTimeStamp("timeStamp1");
        srm_entryDB.addEntry(srm_entry);
        

        srm_entry.setFile_id("file_id2");
        srm_entry.setDataset_id("dataset_id2");
        srm_entry.setTimeStamp("timeStamp2");
        srm_entryDB.addEntry(srm_entry);

        srm_entry.setFile_id("file_id3");
        srm_entry.setDataset_id("dataset_id2");
        srm_entry.setTimeStamp("timeStamp2");
        srm_entryDB.addEntry(srm_entry);
        
        srm_entry = srm_entryDB.getEntry("file_id1");
        
        
        List<SRMEntry> srm_entries = srm_entryDB.getEntriesForDatasetId("dataset_id2");
        for(int i=0;i<srm_entries.size();i++) {
            SRMEntry srm_entry_ind = srm_entries.get(i);
            System.out.println(srm_entry_ind.toXML());
        }
        
    }
    
    
}