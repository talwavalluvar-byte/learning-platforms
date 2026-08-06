select
      count(*) as failures,
      case
        when count(*) <> 0 then 'true'
        else 'false'
      end as should_warn,
      case
        when count(*) <> 0 then 'true'
        else 'false'
      end as should_error
    from (
      
    
    



select dealer_code_id
from `automobile_dw`.`fct_dealership_summary`
where dealer_code_id is null



      
    ) dbt_internal_test